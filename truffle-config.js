module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    /*compilers: {
        solc: {
          version: "^0.4.16"  // ex:  "0.4.20". (Default: Truffle's installed solc)
        }
    }, */
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: 3 // Match any network id
    }
  }
};
