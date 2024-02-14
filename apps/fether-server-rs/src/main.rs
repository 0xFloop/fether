use axum::{
    body::Body,
    extract::{Path, State},
    http::{HeaderMap, HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use axum_macros::{self, debug_handler};
use dotenv::dotenv;
use either::Either;
use reqwest::*;
use serde::{Deserialize, Serialize};
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::{env, result::Result, str::FromStr, string::ParseError};

#[derive(Clone)]
pub struct AppState {
    db_pool: Pool<MySql>,
}

struct AppError(anyhow::Error);
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}
impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(value: E) -> Self {
        Self(value.into())
    }
}
// impl Into<anyhow::Error> for String {
//     fn into(self) -> anyhow::Error {
//         anyhow::anyhow!(self)
//     }
// }

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
        //we may need a get request that returns the headers/options
        .route("/rpc/:api_key", post(rpc_handler))
        .route("/fetherkit/:api_key", post(rpc_handler))
        .route("/payload", post(rpc_handler))
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
        return (StatusCode::OK, Json(self)).into_response();
    }
}
impl IntoResponse for RpcResponseError {
    fn into_response(self) -> Response {
        return (StatusCode::BAD_REQUEST, Json(self)).into_response();
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

    let _response: RpcResponseBody = match serde_json::from_str(&res_string) {
        Ok(res) => return Ok(res),
        Err(_) => {
            let error_response: RpcResponseError = match serde_json::from_str(&res_string) {
                Ok(res) => res,
                Err(_) => return Err(RpcResponseError::from_str("Unknown rpc response error")),
            };
            return Err(error_response);
        }
    };
}
