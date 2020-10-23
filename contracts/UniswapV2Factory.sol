pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public admin;
    address public baseToken;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    mapping(address => bool) public liquidityProviders;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    event LiquidityProviderRegistered(address indexed lpAddress);
    event LiquidityProviderRemoved(address indexed lpAddress);

    modifier adminOnly {
        require(msg.sender == admin, 'Celswap: FORBIDDEN');
        _;
    }

    constructor(address _admin, address _baseToken) public {
        admin = _admin;
        baseToken = _baseToken;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'Celswap: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'Celswap: ZERO_ADDRESS');
        require(token0 == baseToken || token1 == baseToken, 'Celswap: NON_BASE_TOKEN_PAIR');
        require(getPair[token0][token1] == address(0), 'Celswap: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external adminOnly {
        feeTo = _feeTo;
    }

    function setAdmin(address _admin) external adminOnly {
        admin = _admin;
    }

    function registerLiquidityProvider(address lpAddress) external adminOnly {
        require(liquidityProviders[lpAddress] == false, 'Celswap: ALREADY_REGISTERED');
        liquidityProviders[lpAddress] = true;
        emit LiquidityProviderRegistered(lpAddress);
    }

    function removeLiquidityProvider(address lpAddress) external adminOnly {
        require(liquidityProviders[lpAddress] == true, 'Celswap: NOT_REGISTERED');
        liquidityProviders[lpAddress] = false;
        emit LiquidityProviderRemoved(lpAddress);
    }
}
