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

pub async fn fetherkit_handler(
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
