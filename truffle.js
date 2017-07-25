module.exports = {
    networks: {
        quorum: {
            host: "localhost",
            port: 22000,
            network_id: "*" // Match any network id
        },
        testrpc: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        }
    }
};
