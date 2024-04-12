use alloy_core::{
    hex::{self},
    json_abi,
};
use axum::{
    async_trait,
    body::Bytes,
    extract::{FromRequest, Path, Request, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use axum_macros::{self, debug_handler};
use ethers::core::{types::transaction::eip2718::TypedTransaction, utils::rlp};
use reqwest::{self};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, env, result::Result, string::String};

use crate::AppState;

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
    pub fn from_str(s: &str) -> Self {
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
pub struct ExtractRpcRequest(RpcRequestBody);

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
pub async fn rpc_handler(
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
