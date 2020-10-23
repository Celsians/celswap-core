pragma solidity >=0.5.0;

interface IUniswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    event LiquidityProviderRegistered(address indexed lpAddress);
    event LiquidityProviderRemoved(address indexed lpAddress);

    function feeTo() external view returns (address);
    function admin() external view returns (address);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function liquidityProviders(address lpAddress) external view returns (bool);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;
    function setAdmin(address) external;

    function registerLiquidityProvider(address) external;
    function removeLiquidityProvider(address) external;
}