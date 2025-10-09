// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VolunteerComment {
    struct Comment {
        address user;
        string text;
        uint64 timestamp;
    }

    mapping(uint256 => Comment[]) private _comments;

    event Commented(uint256 indexed recordId, address indexed user, string text);

    function addComment(uint256 recordId, string calldata text) external {
        _comments[recordId].push(Comment({
            user: msg.sender,
            text: text,
            timestamp: uint64(block.timestamp)
        }));
        emit Commented(recordId, msg.sender, text);
    }

    function getCount(uint256 recordId) external view returns (uint256) {
        return _comments[recordId].length;
    }

    function getWindow(
        uint256 recordId,
        uint256 start,
        uint256 count
    ) external view returns (address[] memory users, string[] memory texts, uint64[] memory timestamps) {
        Comment[] storage arr = _comments[recordId];
        uint256 end = start + count;
        if (end > arr.length) end = arr.length;
        uint256 size = end > start ? end - start : 0;
        users = new address[](size);
        texts = new string[](size);
        timestamps = new uint64[](size);
        for (uint256 i = 0; i < size; i++) {
            Comment storage c = arr[start + i];
            users[i] = c.user;
            texts[i] = c.text;
            timestamps[i] = c.timestamp;
        }
    }
}




