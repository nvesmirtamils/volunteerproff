// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VolunteerLike {
    // recordId => like count
    mapping(uint256 => uint256) public likes;
    // recordId => user => liked
    mapping(uint256 => mapping(address => bool)) public liked;

    event Liked(uint256 indexed recordId, address indexed user, bool like, uint256 total);

    function toggleLike(uint256 recordId) external returns (bool like, uint256 total) {
        bool prev = liked[recordId][msg.sender];
        if (prev) {
            liked[recordId][msg.sender] = false;
            uint256 c = likes[recordId];
            likes[recordId] = c > 0 ? c - 1 : 0;
        } else {
            liked[recordId][msg.sender] = true;
            likes[recordId] += 1;
        }
        emit Liked(recordId, msg.sender, !prev, likes[recordId]);
        return (!prev, likes[recordId]);
    }

    function getLike(uint256 recordId, address user) external view returns (bool, uint256) {
        return (liked[recordId][user], likes[recordId]);
    }
}




