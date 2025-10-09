// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IVolunteerBadge {
    function mintIfHigherLevel(address user, uint8 level) external returns (uint256 tokenId);
}

contract VolunteerProof is SepoliaConfig {
    struct VolunteerRecord {
        bytes32 activityHash;    // keccak256(activity)
        string ipfsCid;          // metadata/image CID
        euint32 encHours;        // encrypted hours
        euint64 date;            // encrypted yyyymmdd or timestamp
        bool isPublic;           // public wall or private
        address user;            // owner
        uint64 createdAt;        // block timestamp
    }

    VolunteerRecord[] private _records;
    mapping(address => uint256[]) private _userRecordIds;

    // Encrypted total hours per user
    mapping(address => euint32) private _totalHours;

    // Public record count for on-chain badge awarding (count-based)
    mapping(address => uint32) public publicRecordCount;

    // Badge contract (optional)
    IVolunteerBadge public badge;

    event RecordSubmitted(
        address indexed user,
        uint256 indexed recordId,
        bool isPublic,
        bytes32 activityHash,
        string ipfsCid
    );

    constructor(address badgeAddress) {
        badge = IVolunteerBadge(badgeAddress);
    }

    // Submit encrypted record. `extHours` and `extDate` must be created with relayer-sdk inputs
    function submitRecord(
        bytes32 activityHash,
        string calldata ipfsCid,
        externalEuint32 extHours,
        externalEuint64 extDate,
        bytes calldata inputProof,
        bool isPublic
    ) external {
        euint32 hoursEnc = FHE.fromExternal(extHours, inputProof);
        euint64 dateEnc = FHE.fromExternal(extDate, inputProof);

        // Store record
        _records.push(VolunteerRecord({
            activityHash: activityHash,
            ipfsCid: ipfsCid,
            encHours: hoursEnc,
            date: dateEnc,
            isPublic: isPublic,
            user: msg.sender,
            createdAt: uint64(block.timestamp)
        }));
        uint256 id = _records.length - 1;
        _userRecordIds[msg.sender].push(id);

        // Update encrypted total hours: total = total + hours
        _totalHours[msg.sender] = FHE.add(_totalHours[msg.sender], hoursEnc);

        // ACL: allow contract and user to access these encrypted fields
        FHE.allowThis(_records[id].encHours);
        FHE.allowThis(_totalHours[msg.sender]);
        FHE.allow(_records[id].encHours, msg.sender);
        FHE.allow(_totalHours[msg.sender], msg.sender);

        emit RecordSubmitted(msg.sender, id, isPublic, activityHash, ipfsCid);

        // If public, increment count for badge awarding
        if (isPublic) {
            publicRecordCount[msg.sender] += 1;
        }
    }

    function getUserRecordIds(address user) external view returns (uint256[] memory) {
        return _userRecordIds[user];
    }

    function getRecord(uint256 id)
        external
        view
        returns (
            bytes32 activityHash,
            string memory ipfsCid,
            euint32 encHours,
            euint64 date,
            bool isPublic,
            address user,
            uint64 createdAt
        )
    {
        VolunteerRecord storage r = _records[id];
        return (r.activityHash, r.ipfsCid, r.encHours, r.date, r.isPublic, r.user, r.createdAt);
    }

    function getTotalHours(address user) external view returns (euint32) {
        return _totalHours[user];
    }

    function getPublicRecordCount(address user) external view returns (uint256) {
        uint256 count = 0;
        uint256 len = _userRecordIds[user].length;
        for (uint256 i = 0; i < len; i++) {
            if (_records[_userRecordIds[user][i]].isPublic) count++;
        }
        return count;
    }

    // Deprecated: use getPublicRecordCount(address) returning uint256 instead

    // Public wall helper: return a window of records metadata (ids). Frontend will fetch details & decrypt as needed
    function getPublicRecordWindow(uint256 startId, uint256 count)
        external
        view
        returns (uint256[] memory ids)
    {
        uint256 end = startId + count;
        if (end > _records.length) end = _records.length;
        uint256 size = end > startId ? end - startId : 0;
        ids = new uint256[](size);
        uint256 j;
        for (uint256 i = startId; i < end; i++) {
            if (_records[i].isPublic) {
                ids[j++] = i;
            }
        }
        assembly { mstore(ids, j) }
    }

    // Badge awarding using encrypted comparisons with scalar thresholds
    function awardBadge(address user) external {
        // thresholds: 1, 5, 10, 20 public records
        uint32 c = publicRecordCount[user];
        uint8 level = 0;
        if (c >= 1) level = 1;
        if (c >= 5) level = 2;
        if (c >= 10) level = 3;
        if (c >= 20) level = 4;
        if (address(badge) != address(0) && level > 0) {
            badge.mintIfHigherLevel(user, level);
        }
    }
}


