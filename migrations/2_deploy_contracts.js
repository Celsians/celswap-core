const UniswapV2Factory = artifacts.require("UniswapV2Factory");

require('dotenv').config();
const adminAddress = process.env.ADMIN_ADDRESS;
const baseTokenAddress = process.env.BASE_TOKEN_ADDRESS;

module.exports = function(deployer) {
    deployer.deploy(UniswapV2Factory, adminAddress, baseTokenAddress);
};
