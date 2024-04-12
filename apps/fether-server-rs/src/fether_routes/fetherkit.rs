use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use std::{collections::HashMap, result::Result, string::String};

use crate::fether_routes::rpc::RpcResponseError;
use crate::AppState;

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
