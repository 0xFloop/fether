use axum::{
    routing::{get, options, post},
    Router,
};
use dotenv::dotenv;
use sqlx::{mysql::MySqlPool, MySql, Pool};
use std::env;
use tower_http::cors::CorsLayer;

mod fether_routes;
use fether_routes::{fetherkit, payload, rpc};

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
        .route("/rpc/:api_key", post(rpc::rpc_handler))
        .route("/fetherkit/:api_key", get(fetherkit::fetherkit_handler))
        .route("/payload", post(payload::github_payload_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3420").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
