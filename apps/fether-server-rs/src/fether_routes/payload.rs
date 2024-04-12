use alloy_core::{
    hex::{self, FromHex},
    json_abi,
};
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
use chrono::prelude::*;
use dotenv::dotenv;
use ethers::{
    contract::ContractFactory,
    core::{
        types::{transaction::eip2718::TypedTransaction, Address, U256},
        utils::rlp,
    },
    providers::{Http, Middleware, Provider},
    types::TransactionRequest,
};
use octocrab::Octocrab;
use reqwest::{self};
use serde::{Deserialize, Serialize};
use serde_json::{Number, Value};
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::{collections::HashMap, env, result::Result, str::FromStr, string::String};
use tower_http::cors::CorsLayer;

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

pub async fn github_payload_handler(
    State(state): State<AppState>,
    Json(payload): Json<Value>,
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

        let Ok(mut gh_repo_contents) = octocrab
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

        let contents = gh_repo_contents.take_items()[0].decoded_content().unwrap();

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
                            "http://localhost:3420/rpc/{}",
                            api_key
                        ))
                        .expect("could not instantiate provider");

                        let addr = match Address::from_str(deployer_address) {
                            Ok(val) => val,
                            Err(err) => {
                                println!("error: {err}");
                                continue 'repo_loop;
                            }
                        };

                        let deployer_balance = match provider.get_balance(addr, None).await {
                            Ok(bal) => bal.as_u64(),
                            Err(err) => {
                                println!("balance getter err: {err}");
                                0
                            }
                        };

                        if deployer_balance == 0 {
                            match provider
                                .request::<[&str; 2], Value>(
                                    "anvil_setBalance",
                                    [deployer_address, "0xDE0B6B3A7640000"],
                                )
                                .await
                            {
                                Ok(_) => (),
                                Err(err) => {
                                    println!("provider error: {err}");
                                    continue 'all_commits_loop;
                                }
                            };
                        };

                        //anvil impersonate deployer

                        let contract_data =
                            ethers::types::Bytes::from_hex(&contents_json.bytecode.object).unwrap();

                        //update to use the cached deployment args
                        let deploy_args_str = &repo.cachedConstructorArgs;

                        let raw_args = match serde_json::from_str::<Vec<Value>>(
                            deploy_args_str.as_ref().unwrap(),
                        ) {
                            Ok(val) => val,
                            Err(err) => Vec::new(),
                        };
                        println!("raw args: {raw_args:?}");

                        let deploy_args: Vec<ethers::abi::Token> = raw_args
                            .iter()
                            .map(|val| parse_serde_value_to_ethers_token(val).unwrap())
                            .collect::<Vec<ethers::abi::Token>>();

                        //parse the deploy args into a vec of tokens, if there are none, call the deploy
                        //function with '()'

                        println!("deploy args: {deploy_args:?}");

                        let abi: ethers::abi::Abi = serde_json::from_str(&str_abi).unwrap();

                        let provider = std::sync::Arc::new(provider);

                        let deploy_factory =
                            ContractFactory::new(abi, contract_data.clone(), provider.clone());

                        let contract_deployment = deploy_factory.deploy_tokens(deploy_args);

                        let factory_deploy_details = contract_deployment.unwrap();

                        let deploy_tx: TransactionRequest = TransactionRequest {
                            from: Some(addr),
                            to: None,
                            gas: None,
                            gas_price: None,
                            value: None,
                            data: Some(factory_deploy_details.tx.data().unwrap().clone()),
                            nonce: None,
                            chain_id: None,
                        };

                        match provider
                            .request::<[&str; 1], Value>(
                                "anvil_impersonateAccount",
                                [deployer_address],
                            )
                            .await
                        {
                            Ok(_) => (),
                            Err(err) => {
                                println!("Err: {err}");
                                continue 'repo_loop;
                            }
                        };
                        let pending_tx = provider.send_transaction(deploy_tx, None).await.unwrap();

                        let Ok(_) = provider
                            .request::<[&str; 1], Value>(
                                "anvil_stopImpersonatingAccount",
                                [deployer_address],
                            )
                            .await
                        else {
                            continue 'repo_loop;
                        };
                        println!("pending tx hash: {:?}", pending_tx.tx_hash());

                        let hash = pending_tx.tx_hash();

                        let hash_string = format!("{:#x}", hash);

                        let Some(receipt) = pending_tx.await.unwrap() else {
                            continue 'repo_loop;
                        };

                        let Some(new_contract_address) = receipt.contract_address else {
                            continue 'repo_loop;
                        };
                        let contract_addr_str = format!("{:#x}", new_contract_address);

                        match sqlx::query!("INSERT INTO Transaction (txHash, repositoryId, functionName, callerUsername) VALUES (?,?,?,?)",hash_string, repo.id,"Github Deployment",user_name).execute(&db_pool).await {
                            Ok(res) => println!("{:?}",res),
                            Err(err) => println!("{:?}",err)
                        };
                        match sqlx::query!("UPDATE Repository SET contractAddress = ?, contractAbi = ?, lastDeployed = ? WHERE Repository.id = ?", contract_addr_str, str_abi,Utc::now(), repo.id).execute(&db_pool).await {
                            Ok(res) => println!("{:?}",res),
                            Err(err) => println!("{:?}",err)
                        }
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

//i absolutely guarantee this has bugs and will not work properly for all param types/cases, but im just building this to
//learn rust so i dont mind terribly that it is buggy

fn parse_serde_value_to_ethers_token(val: &Value) -> Result<ethers::abi::Token, &'static str> {
    let token = match val {
        serde_json::Value::Bool(val) => ethers::abi::Token::Bool(*val),
        serde_json::Value::String(val) => ethers::abi::Token::String(val.clone()),
        serde_json::Value::Number(val) => match val.as_u64() {
            Some(val2) => ethers::abi::Token::Uint(U256::from(val2)),
            None => match val.as_i64() {
                Some(val3) => ethers::abi::Token::Int(U256::from(val3)),
                None => return Err("error parsing value"),
            },
        },
        //im quite happy with how this works
        serde_json::Value::Array(val) => ethers::abi::Token::Array(
            val.iter()
                .map(|val2| parse_serde_value_to_ethers_token(val2).unwrap())
                .collect::<Vec<ethers::abi::Token>>(),
        ),
        serde_json::Value::Object(val) => ethers::abi::Token::Tuple(
            val.into_iter()
                .map(|(_, val3)| parse_serde_value_to_ethers_token(val3).unwrap())
                .collect::<Vec<ethers::abi::Token>>(),
        ),
        serde_json::Value::Null => return Err("error parsing value"),
    };
    Ok(token)
}
