export const VolunteerCommentABI = {
  abi: [
    {
      "inputs": [
        { "internalType": "uint256", "name": "recordId", "type": "uint256" },
        { "internalType": "string", "name": "text", "type": "string" }
      ],
      "name": "addComment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "recordId", "type": "uint256" }
      ],
      "name": "getCount",
      "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "recordId", "type": "uint256" },
        { "internalType": "uint256", "name": "start", "type": "uint256" },
        { "internalType": "uint256", "name": "count", "type": "uint256" }
      ],
      "name": "getWindow",
      "outputs": [
        { "internalType": "address[]", "name": "users", "type": "address[]" },
        { "internalType": "string[]", "name": "texts", "type": "string[]" },
        { "internalType": "uint64[]", "name": "timestamps", "type": "uint64[]" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};




