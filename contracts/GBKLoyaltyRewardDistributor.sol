// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract GBKLoyaltyRewardDistributor {
    IERC20 public immutable gbk;
    address public owner;
    address public platformWallet;
    bool public paused;

    mapping(bytes32 => bool) public settled;

    event RewardSettled(
        bytes32 indexed orderId,
        address indexed merchant,
        address indexed customer,
        address founder,
        uint256 total,
        uint256 customerAmount,
        uint256 founderAmount,
        uint256 platformAmount
    );
    event Paused(bool status);
    event PlatformWalletUpdated(address indexed wallet);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    constructor(address gbkToken, address initialPlatformWallet) {
        require(gbkToken != address(0), "bad token");
        require(initialPlatformWallet != address(0), "bad platform");
        gbk = IERC20(gbkToken);
        owner = msg.sender;
        platformWallet = initialPlatformWallet;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function settle(
        bytes32 orderId,
        address merchant,
        address customer,
        address founder,
        uint256 totalAmount
    ) external onlyOwner whenNotPaused {
        require(!settled[orderId], "already settled");
        require(merchant != address(0), "bad merchant");
        require(customer != address(0), "bad customer");
        require(totalAmount > 0, "zero amount");

        uint256 customerAmount = (totalAmount * 6000) / 10000;
        uint256 founderAmount = (totalAmount * 2000) / 10000;
        uint256 platformAmount = totalAmount - customerAmount - founderAmount;

        // If there is no legitimate founder/referrer, the unassigned 20% stays
        // within the platform allocation rather than being sent to a null address.
        if (founder == address(0)) {
            platformAmount += founderAmount;
            founderAmount = 0;
        }

        require(
            gbk.transferFrom(merchant, address(this), totalAmount),
            "merchant transfer failed"
        );

        require(gbk.transfer(customer, customerAmount), "customer transfer failed");

        if (founderAmount > 0) {
            require(gbk.transfer(founder, founderAmount), "founder transfer failed");
        }

        require(gbk.transfer(platformWallet, platformAmount), "platform transfer failed");

        settled[orderId] = true;

        emit RewardSettled(
            orderId,
            merchant,
            customer,
            founder,
            totalAmount,
            customerAmount,
            founderAmount,
            platformAmount
        );
    }

    function setPaused(bool status) external onlyOwner {
        paused = status;
        emit Paused(status);
    }

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "bad platform");
        platformWallet = wallet;
        emit PlatformWalletUpdated(wallet);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "bad owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(gbk), "GBK rescue disabled");
        require(to != address(0), "bad recipient");
        require(IERC20(token).transfer(to, amount), "rescue failed");
    }
}
