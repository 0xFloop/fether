use alloy_core::{hex, json_abi};
use axum::{
    async_trait,
    body::Bytes,
    extract::{FromRequest, Path, Request, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, options, post},
    Json, Router,
};
use axum_macros::{self, debug_handler};
use dotenv::dotenv;
use ethers_core::{
    abi::{decode, AbiType},
    types::{transaction::eip2718::TypedTransaction, Address, TransactionRequest},
    utils::rlp,
};
use ethers_providers::{Http, Middleware, Provider};
use jsonwebtoken::*;
use octocrab::Octocrab;
use reqwest::{self};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::env;
use std::{collections::HashMap, result::Result, string::String};
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppState {
    db_pool: Pool<MySql>,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let db_pool =
        match MySqlPool::connect(&env::var("DATABASE_URL").expect("Internal server error 479"))
            .await
        {
            Ok(pool) => pool,
            Err(_) => panic!("Error loading database_url"),
        };

    let state = AppState { db_pool };

    let app = Router::new()
        .route("/rpc/:api_key", post(rpc_handler))
        .route("/fetherkit/:api_key", get(fetherkit_handler))
        .route("/payload", post(github_payload_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3420").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[derive(Debug, Serialize, Deserialize)]
struct UnknownJson(HashMap<String, Value>);

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
enum RequestParams {
    String(String),
    Map(HashMap<String, RequestParams>),
    Bool(bool),
    U64(u64),
    Vec(Vec<RequestParams>),
}

#[derive(Serialize, PartialEq, Deserialize, Debug)]
#[serde(untagged)]
enum NumOrString {
    U64(u64),
    String(String),
}
#[derive(Serialize, Deserialize, Debug)]
pub struct RpcRequestBody {
    jsonrpc: String,
    id: NumOrString,
    method: String,
    params: Option<Vec<RequestParams>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcResponseError {
    jsonrpc: String,
    id: NumOrString,
    error: RpcError,
}

#[derive(Serialize, Deserialize, Debug)]
struct RpcError {
    code: i32,
    message: String,
}

impl IntoResponse for RpcResponseError {
    fn into_response(self) -> Response {
        let res = (StatusCode::BAD_REQUEST, Json(self)).into_response();
        res
    }
}

impl RpcResponseError {
    fn from_str(s: &str) -> Self {
        RpcResponseError {
            jsonrpc: "2.0".to_string(),
            id: NumOrString::U64(0),
            error: RpcError {
                code: 480,
                message: s.to_string(),
            },
        }
    }
}
struct ExtractRpcRequest(RpcRequestBody);

#[async_trait]
impl<T> FromRequest<T> for ExtractRpcRequest
where
    Bytes: FromRequest<T>,
    T: Send + Sync,
{
    type Rejection = Response;
    async fn from_request(req: Request, state: &T) -> Result<Self, Self::Rejection> {
        let body = Bytes::from_request(req, state)
            .await
            .map_err(IntoResponse::into_response)?;

        let body_string = String::from_utf8(body.to_vec()).unwrap();

        let req_from_body = match serde_json::from_str::<RpcRequestBody>(&body_string) {
            Ok(req) => req,
            Err(_) => {
                println!("{:?}", body_string);
                return Err((StatusCode::BAD_REQUEST, "Invalid rpc request shape").into_response());
            }
        };

        Ok(Self(req_from_body))
    }
}

#[debug_handler]
async fn rpc_handler(
    State(state): State<AppState>,
    Path(api_key): Path<String>,
    ExtractRpcRequest(payload): ExtractRpcRequest,
) -> Result<impl IntoResponse, impl IntoResponse> {
    //1. validate the api key -- done
    //2. validate the request -- done
    //3. send the request to the anvil client -- done
    //4. create new transaciton in db -- done
    //5. return the anvil clients response

    let db_pool = state.db_pool;

    let db_res: Vec<_> = match sqlx::query!(
        "SELECT a.key, u.id as userId, u.username, r.id as reposId, r.contractAbi FROM ApiKey a INNER JOIN User u ON a.userId = u.id INNER JOIN Repository r ON r.userId = u.id WHERE a.key = ?",
        api_key
    )
    .fetch_all(&db_pool)
    .await
    {
        Ok(res) => res,
        Err(_) => {
            return Err(RpcResponseError::from_str(
                "Internal server error retrieving key data",
            ))
        }
    };

    if db_res.len() == 0 {
        return Err(RpcResponseError::from_str("Invalid api key"));
    }

    let rpc_url = env::var("ANVIL_SERVER_IP").expect("Internal server error 480");

    let client = reqwest::Client::new();

    let anvil_res = match client.post(rpc_url).json(&payload).send().await {
        Ok(res) => res,
        Err(_) => {
            return Err(RpcResponseError::from_str("Internal rpc server error"));
        }
    };

    let res: HashMap<String, Value> = match anvil_res.json().await {
        Ok(res) => res,
        Err(_) => {
            return Err(RpcResponseError::from_str("Unknown rpc response error"));
        }
    };

    //valid tx, add it to database
    if payload.method == "eth_sendRawTransaction" {
        let hash = match res.get("result") {
            Some(Value::String(hash)) => hash,
            _ => return Ok(Json(res)),
        };

        let Some(abi_string) = &db_res.get(0).unwrap().contractAbi else {
            return Err(RpcResponseError::from_str("test error"));
        };

        let abi: json_abi::JsonAbi = serde_json::from_str(abi_string).unwrap();
        let raw = payload.params.unwrap().get(0).unwrap().clone();

        let tx_hex = match raw {
            RequestParams::String(s) => s,
            _ => return Err(RpcResponseError::from_str("Invalid sendRawTransaction")),
        };
        let function_name = decode_raw_tx(&tx_hex, &abi);

        let user_name = &db_res.get(0).unwrap().username;

        match sqlx::query!("INSERT INTO Transaction (txHash, repositoryId, functionName, callerUsername) VALUES (?,?,?,?)",hash,"clsc68gz60004i0l50dreuypo",function_name,user_name).execute(&db_pool).await {
            Ok(res) => println!("{:?}",res),
            Err(err) => println!("{:?}",err)
        };
    }

    Ok(Json(res))
}
fn decode_raw_tx<'a>(raw_hex: &str, abi: &'a json_abi::JsonAbi) -> &'a str {
    let selectors = abi.functions();

    let hex = hex::decode(raw_hex).unwrap();

    let tx_rlp = rlp::Rlp::new(hex.as_slice());

    let (tx, _) = TypedTransaction::decode_signed(&tx_rlp).unwrap();

    let tx_selector = hex::encode(&tx.data().unwrap()[..4]);

    for function in selectors {
        if function.selector().to_string() == "0x".to_string() + &tx_selector {
            return &function.name;
        }
    }

    ""
}

async fn fetherkit_handler(
    State(state): State<AppState>,
    Path(api_key): Path<String>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let db_pool = state.db_pool;

    let db_res = match sqlx::query!(
        "SELECT r.contractAddress, r.contractAbi FROM ApiKey a INNER JOIN User u ON a.userId = u.id INNER JOIN Repository r ON r.userId = u.id WHERE a.key = ?",
        api_key
    )
    .fetch_one(&db_pool)
    .await
    {
        Ok(res) => res,
        Err(_) => {
            return Err(RpcResponseError::from_str(
                "Internal server error retrieving key data",
            ))
        }
    };
    let contract_address = match &db_res.contractAddress {
        Some(val) => val,
        None => {
            return Err(RpcResponseError::from_str(
                "Internal server error retrieving key data",
            ))
        }
    };

    let contract_abi = match &db_res.contractAbi {
        Some(val) => val,
        None => {
            return Err(RpcResponseError::from_str(
                "Internal server error retrieving key data",
            ))
        }
    };
    let res: HashMap<&str, String> = HashMap::from([
        ("contractAddress", contract_address.clone()),
        ("contractAbi", contract_abi.clone()),
    ]);

    Ok(Json(res))
}

#[derive(Serialize, PartialEq, Deserialize, Debug)]
struct TestRes {
    test: String,
}
#[derive(Serialize, Deserialize, Debug)]
struct GithubPayload {
    installation: Installation,
    #[serde(rename = "ref")]
    gh_ref: String,
    repository: RepoDetails,
    commits: Vec<Commit>,
}
#[derive(Serialize, Deserialize, Debug)]
struct Commit {
    modified: Vec<String>,
}
#[derive(Serialize, Deserialize, Debug)]
struct Installation {
    id: u64,
}
#[derive(Serialize, Deserialize, Debug)]
struct RepoDetails {
    id: u64,
}
#[derive(Serialize, Deserialize, Debug)]
struct OctocrabResponse {
    abi: Vec<Value>,
    bytecode: BytecodeObject,
}
#[derive(Serialize, Deserialize, Debug)]
struct BytecodeObject {
    object: String,
}

async fn github_payload_handler(
    State(state): State<AppState>,
    Json(payload): Json<UnknownJson>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let db_pool = state.db_pool;

    let gh_payload =
        match serde_json::from_str::<GithubPayload>(&serde_json::to_string(&payload).unwrap()) {
            Ok(data) => data,
            Err(err) => {
                println!("{:?}", err);
                return Err("Error parsing github payload");
            }
        };

    // "SELECT r.*, a.key  FROM Repository r INNER JOIN Team t ON t.id = r.teamId INNER JOIN User u ON u.id = r.userId LEFT JOIN ApiKey a ON a.userId = u.id OR a.teamId = t.id WHERE r.id= ?",
    // gh_payload.installation.id

    let mut repo_details = match sqlx::query!(
        "SELECT * FROM Repository r WHERE r.repoId= ?",
        gh_payload.repository.id
    )
    .fetch_all(&db_pool)
    .await
    {
        Ok(res) => res,
        Err(_) => return Err("Internal server error retrieving key data"),
    };

    'repo_loop: for repo in &mut repo_details {
        let mut api_key = String::new();

        if repo.userId.is_some() {
            api_key = match sqlx::query!(
                "SELECT ApiKey.key FROM ApiKey WHERE ApiKey.userId = ?",
                repo.userId
            )
            .fetch_one(&db_pool)
            .await
            {
                Ok(res) => res.key,
                Err(_) => continue 'repo_loop,
            };
        } else if repo.teamId.is_some() {
            api_key = match sqlx::query!(
                "SELECT ApiKey.key FROM ApiKey WHERE ApiKey.teamId = ?",
                repo.teamId
            )
            .fetch_one(&db_pool)
            .await
            {
                Ok(res) => res.key,
                Err(_) => continue 'repo_loop,
            };
        } else {
            continue 'repo_loop;
        }
        if api_key.is_empty() {
            continue 'repo_loop;
        };

        let Some(github_ref) = gh_payload.gh_ref.split('/').last() else {
            continue 'repo_loop;
        };

        let Some(tracking_branch) = repo.branchName.clone() else {
            continue 'repo_loop;
        };

        if !(github_ref == &tracking_branch) {
            continue 'repo_loop;
        };

        let Some(tracked_filename) = repo.filename.clone() else {
            continue 'repo_loop;
        };

        let repo_url = repo.repoName.clone();

        let mut parts = repo_url.split('/');

        let (Some(user_name), Some(repo_name)) = (parts.next(), parts.next()) else {
            return Err("Error improperly formated repo url.");
        };

        let Some(root_dir) = &repo.foundryRootDir else {
            return Err("Error unable to find foundry root directory.");
        };

        let Some(file_name) = &repo.filename else {
            continue 'repo_loop;
        };
        let Some(deployer_address) = &repo.deployerAddress else {
            continue 'repo_loop;
        };

        let byte_code_path = root_dir.clone()
            + "/out/"
            + file_name
            + "/"
            + file_name
                .split('.')
                .next()
                .ok_or("Error improper file name format")?
            + ".json";

        // println!("{user_name}/{repo_name}");
        // println!("{tracking_branch}");
        // println!("{byte_code_path}");

        let Ok(gh_app_id) = env::var("GH_APP_ID") else {
            return Err("Error parsing github app details");
        };
        let Ok(gh_app_pk) = env::var("GH_APP_PK") else {
            return Err("Error parsing github app details");
        };

        let pk = gh_app_pk.replace("/\\n/g", "\n");

        let key = jsonwebtoken::EncodingKey::from_rsa_pem(pk.as_bytes()).unwrap();

        let app_id = gh_app_id.parse::<u64>().unwrap().into();

        let Ok(octocrab) = Octocrab::builder().app(app_id, key).build() else {
            return Err("Error building octocrab instance");
        };

        let Ok(mut repo_contents) = octocrab
            .installation(octocrab::models::InstallationId(gh_payload.installation.id))
            .repos(user_name, repo_name)
            .get_content()
            .path(byte_code_path)
            .r#ref(tracking_branch)
            .send()
            .await
        else {
            continue 'repo_loop;
        };

        let contents = repo_contents.take_items()[0].decoded_content().unwrap();

        let contents_json: OctocrabResponse = serde_json::from_str(&contents).unwrap();

        'all_commits_loop: for commit in &gh_payload.commits {
            'current_commit_loop: for modified in &commit.modified {
                if modified.ends_with("sol") {
                    let Some(modified_file_name) = modified.split('/').last() else {
                        continue 'current_commit_loop;
                    };

                    if &tracked_filename == file_name {
                        println!("Root dir: {root_dir}");
                        println!("Mod file: {modified_file_name}");
                        println!("Username: {user_name}");
                        println!("Repo name: {repo_name}");

                        let str_abi = format!(
                            "[{}]",
                            contents_json
                                .abi
                                .iter()
                                .map(|s| format!("{}", s))
                                .collect::<Vec<_>>()
                                .join(",")
                        );

                        //get custom fether chain from api_key

                        //if deployer balance <1, use admin to anvil setBalance

                        let provider = Provider::<Http>::try_from(format!(
                            "https://fether-testing.ngrok.app/rpc/{}",
                            api_key
                        ))
                        .expect("could not instantiate provider");

                        let deployer_balance =
                            match provider.get_balance(deployer_address, None).await {
                                Ok(bal) => bal,
                                Err(err) => {
                                    println!("balance getter err: {err}");
                                    ethers_core::types::U256([0, 0, 0, 0])
                                }
                            };

                        println!("balance: {deployer_balance}");
                        println!("deplyer address: {deployer_address}");

                        if deployer_balance == ethers_core::types::U256([0, 0, 0, 0]) {
                            match provider
                                .request::<[&str; 2], String>(
                                    "anvil_setBalance",
                                    [deployer_address, "0xDE0B6B3A7640000"],
                                )
                                .await
                            {
                                Ok(res) => (),
                                Err(err) => {
                                    println!("provider error: {err}");
                                    return Err("Error increasing deployer address balance");
                                }
                            };
                        };
                        //anvil impersonate deployer
                        let new_deployer_balance = provider
                            .get_balance(deployer_address, None)
                            .await
                            .unwrap_or(ethers_core::types::U256([0, 0, 0, 0]));

                        println!("{new_deployer_balance}");

                        //deploy contract

                        //stop impersonating

                        //await transaction receipt

                        //add tx to db

                        //update repository in db with new contract address and lastDeployed time

                        continue 'repo_loop;
                    }
                } else {
                    println!("we modified this NON sol file : {:?}", modified);
                }
            }
        }
    }
    Ok(())
}
