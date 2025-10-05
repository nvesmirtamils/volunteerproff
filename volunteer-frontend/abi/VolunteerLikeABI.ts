export const VolunteerLikeABI = {
  abi: [
    {
      "inputs": [
        { "internalType": "uint256", "name": "recordId", "type": "uint256" }
      ],
      "name": "toggleLike",
      "outputs": [
        { "internalType": "bool", "name": "like", "type": "bool" },
        { "internalType": "uint256", "name": "total", "type": "uint256" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "recordId", "type": "uint256" },
        { "internalType": "address", "name": "user", "type": "address" }
      ],
      "name": "getLike",
      "outputs": [
        { "internalType": "bool", "name": "", "type": "bool" },
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};




