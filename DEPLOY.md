# Deployment procedure

To deploy Celswap core contracts follow these steps:
- Load your Ethereum account with ETH.
- Create `.env` file from `.env.example`, and modify it:
    - Replace `INFURA_ID` with your Project ID from [Infura](https://infura.io/)
    - Replace `PRIVATE_KEY` with private key of your address with ETH on it
    - Replace `ADMIN_ADDRESS` with the appropriate EOA address. Only account with this address will be able to activate protocol fee and change admin address.
    - Replace `BASE_TOKEN_ADDRESS` with the contract address of the base token
- Install dependencies: `yarn install`
- Compile smart contracts: `truffle compile`
- Deploy smart contracts (choose network from truffle-config.js): `truffle migrate --network <NETWORK>`