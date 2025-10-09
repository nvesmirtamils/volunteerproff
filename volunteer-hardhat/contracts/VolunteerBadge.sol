// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VolunteerBadge is ERC721, Ownable {
    uint256 public nextTokenId;

    // user => highest level minted
    mapping(address => uint8) public highestLevel;

    // level => tokenURI
    mapping(uint8 => string) public levelTokenURI;

    mapping(address => bool) public minters;

    constructor() ERC721("VolunteerBadge", "VPB") Ownable(msg.sender) {}

    function setLevelTokenURI(uint8 level, string calldata uri) external onlyOwner {
        levelTokenURI[level] = uri;
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minters[account] = allowed;
    }

    function mintIfHigherLevel(address user, uint8 level) external returns (uint256 tokenId) {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized");
        if (level <= highestLevel[user]) {
            return 0;
        }
        highestLevel[user] = level;
        tokenId = ++nextTokenId;
        _mint(user, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent");
        // Map tokenId to level by reverse scan (simple demo): owner highestLevel
        address owner = _ownerOf(tokenId);
        string memory uri = levelTokenURI[highestLevel[owner]];
        return bytes(uri).length > 0 ? uri : "";
    }
}


