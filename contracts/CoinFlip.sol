// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CoinFlip {

    address public owner;

    event BetResult(address indexed player, bool win, uint256 amountWon);
    event Withdrawn(address indexed player, uint256 amount);

    mapping(address => bool) public allowedTokens;
    constructor(address token1, address token2, address token3) {
        allowedTokens[token1] = true;
        allowedTokens[token2] = true;
        allowedTokens[token3] = true;
        owner = msg.sender;
    }


    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function allowToken(address _tokenAddress, bool _isAllowed) external onlyOwner {
        allowedTokens[_tokenAddress] = _isAllowed;
    }

    function placeBet(uint8 _multiplier, uint256 _amount, bytes memory signature, address _tokenAddress) external returns(bool result){
        require(allowedTokens[_tokenAddress], "This token is not allowed for betting.");
        IERC20 bettingToken = IERC20(_tokenAddress);
        require(_amount > 0, "Bet amount must be greater than 0.");

        require(_amount > 0, "Bet amount must be greater than 0.");
        uint256 potentialPayout = _amount * _multiplier;
        require(bettingToken.balanceOf(address(this)) >= potentialPayout, "Contract does not have enough funds to cover potential winnings.");

        require(bettingToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed.");
        
        require(_multiplier == 2 || _multiplier == 3 || _multiplier == 4, "Invalid multiplier.");

        uint winChance;
        if (_multiplier == 2) {
            winChance = 48; // 48%
        } else if (_multiplier == 3) {
            winChance = 24; // 24%
        } else if (_multiplier == 4) {
            winChance = 12; // 12%
        }

        uint random = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, signature))) % 100;
        bool win = random <= winChance;

        if (win) {
            require(bettingToken.transfer(msg.sender, potentialPayout), "Winning transfer failed.");
            emit BetResult(msg.sender, win, potentialPayout);
            return true;
        } else {
            emit BetResult(msg.sender, win, 0);
            return false;
        }
    }

    function rescueTokens(address _tokenAddress, uint256 _amount) external onlyOwner {
        IERC20(_tokenAddress).transfer(owner, _amount);
    }
}
