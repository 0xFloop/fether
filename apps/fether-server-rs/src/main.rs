use alloy_core::primitives::keccak256;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, options, post},
    Json, Router,
};
use axum_macros::{self, debug_handler};
use dotenv::dotenv;
use reqwest::{self};
use serde::{Deserialize, Serialize};
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::{env, result::Result};
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

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcRequestBody {
    jsonrpc: String,
    id: String,
    method: String,
    params: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcResponseBody {
    jsonrpc: String,
    id: String,
    result: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpcResponseError {
    jsonrpc: String,
    id: String,
    error: RpcError,
}

#[derive(Serialize, Deserialize, Debug)]
struct RpcError {
    code: i32,
    message: String,
}

impl IntoResponse for RpcResponseBody {
    fn into_response(self) -> Response {
        let res = (StatusCode::OK, Json(self)).into_response();
        return res;
    }
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
            id: "0".to_string(),
            error: RpcError {
                code: 480,
                message: s.to_string(),
            },
        };
    }
}

#[debug_handler]
async fn rpc_handler(
    State(state): State<AppState>,
    Path(api_key): Path<String>,
    Json(payload): Json<RpcRequestBody>,
) -> Result<RpcResponseBody, RpcResponseError> {
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

    let res_string = match anvil_res.text().await {
        Ok(res) => res,
        Err(_) => return Err(RpcResponseError::from_str("Unknown rpc response error")),
    };

    let success: RpcResponseBody = match serde_json::from_str(&res_string) {
        Ok(res) => {
            //valid tx, add it to database
            if payload.method == "eth_sendRawTransaction" {
                // let tx_hash = keccak256(payload);
                println!("{:?}", payload)
                //use anvil to get the tx details
                //add to db
                // match sqlx::query!("INSERT INTO Transaction ()")
            }
            return Ok(res);
        }
        Err(_) => {
            let error_response: RpcResponseError = match serde_json::from_str(&res_string) {
                Ok(res) => res,
                Err(_) => return Err(RpcResponseError::from_str("Unknown rpc response error")),
            };
            return Err(error_response);
        }
    };
}
