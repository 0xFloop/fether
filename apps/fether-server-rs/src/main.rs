use alloy_core::primitives::keccak256;
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
use reqwest::{self};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::{collections::HashMap, env, result::Result, string::String};
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
        .route("/fetherkit/:api_key", post(rpc_handler))
        .route("/payload", post(rpc_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3420").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

struct UnknownJson(HashMap<String, Value>);

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum RequestParams {
    String(String),
    Map(HashMap<String, String>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcRequestBody {
    jsonrpc: String,
    id: i32,
    method: String,
    params: Option<Vec<RequestParams>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcResponseError {
    jsonrpc: String,
    id: i32,
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
        return res;
    }
}

impl RpcResponseError {
    fn from_str(s: &str) -> Self {
        return RpcResponseError {
            jsonrpc: "2.0".to_string(),
            id: 0,
            error: RpcError {
                code: 480,
                message: s.to_string(),
            },
        };
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
    //4. create new transaciton in db
    //5. return the anvil clients response

    let db_pool = state.db_pool;

    let res: Vec<_> = match sqlx::query!(
        "SELECT ApiKey.key FROM ApiKey WHERE ApiKey.key = ?",
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

    if res.len() == 0 {
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

    return Ok(Json(res));

    // println!("{:?}", n);
    // let success: RpcResponseBody = match serde_json::from_str(&res_string) {
    //     Ok(res) => {
    //         //valid tx, add it to database
    //         if payload.method == "eth_sendRawTransaction" {
    //             // let tx_hash = keccak256(payload);
    //             // println!("{:?}", payload)
    //             //use anvil to get the tx details
    //             //add to db
    //             // match sqlx::query!("INSERT INTO Transaction ()")
    //         }
    //         return Ok(res);
    //     }
    //     Err(_) => {
    //         let error_response: RpcResponseError = match serde_json::from_str(&res_string) {
    //             Ok(res) => res,
    //             Err(error) => {
    //                 println!("this is the error: {:?}", error);
    //                 return Err(RpcResponseError::from_str("Unknown rpc response error"));
    //             }
    //         };
    //
    //         println!("this is an error response: {:?}", error_response);
    //         return Err(error_response);
    //     }
    // };
}
