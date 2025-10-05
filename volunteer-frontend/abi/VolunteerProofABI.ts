export const VolunteerProofABI = {
  abi: [
    {
      "inputs": [
        { "internalType": "address", "name": "badgeAddress", "type": "address" }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
        { "indexed": true, "internalType": "uint256", "name": "recordId", "type": "uint256" },
        { "indexed": false, "internalType": "bool", "name": "isPublic", "type": "bool" },
        { "indexed": false, "internalType": "bytes32", "name": "activityHash", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "ipfsCid", "type": "string" }
      ],
      "name": "RecordSubmitted",
      "type": "event"
    },
    {
      "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ],
      "name": "awardBadge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" } ],
      "name": "getRecord",
      "outputs": [
      { "internalType": "bytes32", "name": "activityHash", "type": "bytes32" },
      { "internalType": "string", "name": "ipfsCid", "type": "string" },
      { "internalType": "euint32", "name": "encHours", "type": "bytes32" },
      { "internalType": "euint64", "name": "date", "type": "bytes32" },
      { "internalType": "bool", "name": "isPublic", "type": "bool" },
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "startId", "type": "uint256" },
        { "internalType": "uint256", "name": "count", "type": "uint256" }
      ],
      "name": "getPublicRecordWindow",
      "outputs": [ { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" } ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ],
      "name": "getUserRecordIds",
      "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ],
      "name": "getTotalHours",
      "outputs": [ { "internalType": "euint32", "name": "", "type": "bytes32" } ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
      { "internalType": "bytes32", "name": "activityHash", "type": "bytes32" },
      { "internalType": "string", "name": "ipfsCid", "type": "string" },
      { "internalType": "externalEuint32", "name": "extHours", "type": "bytes32" },
      { "internalType": "externalEuint64", "name": "extDate", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" },
      { "internalType": "bool", "name": "isPublic", "type": "bool" }
      ],
      "name": "submitRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};


