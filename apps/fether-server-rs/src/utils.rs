pub struct Chain {
    id: u64,
    name: String,
    network: String,
}
pub fn fether_chain_from_key(api_key: String) -> Chain {
    Chain {
        id: 33,
        name: String::from("hello"),
        network: String::from("World"),
    }
}
