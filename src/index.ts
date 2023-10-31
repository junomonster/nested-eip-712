import { TypedDataUtils } from 'ethers-eip712'

const message = {
  "from": {
    "name": "Cow",
    "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
  },
  "to": {
    "name": "Bob",
    "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
  },
  "contents": "Hello, Bob!"
}

// Types
const Types = {"Person": [
  {
    "name": "name",
    "type": "string"
  },
  {
    "name": "wallet",
    "type": "address"
  }
],
"Mail": [
  {
    "name": "from",
    "type": "Person"
  },
  {
    "name": "to",
    "type": "Person"
  },
  {
    "name": "contents",
    "type": "string"
  }
]}

const typedDataChild = {
  types: {
    EIP712Domain: [
      {name: "name", type: "string"},
      {name: "version", type: "string"},
      {name: "chainId", type: "uint256"},
      {name: "verifyingContract", type: "address"},
    ],
    ...Types
  },
  primaryType: 'Mail' as const,
  domain: {
    name: 'DOMAIN NAME CHILD',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' // contract shared (caller?)
  },
  message
}

function toHexString(byteArray: Uint8Array) {
  return '0x' + Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// hash inner eip-712
const childHash = TypedDataUtils.encodeDigest(typedDataChild)

const typedData = {
  types: {
    EIP712Domain: [
      {name: "name", type: "string"},
      {name: "version", type: "string"},
      {name: "chainId", type: "uint256"},
      {name: "verifyingContract", type: "address"},
    ],
    ...Types,
    Parent: [
      {name: "child", type: "Mail"},
      {name: "childHash", type: "bytes32"},
    ],
  },
  primaryType: 'Parent' as const,
  domain: {
    name: 'DOMAIN NAME PARENT',
    version: '1',
    chainId: 1,
    verifyingContract: '0x4142ccccCCCCcCCCCCCcCcCccCcCCCcCcccc4141' // contract specific (eip-1271 verifier?)
  },
  message: {
    'child': message,
    'childHash': toHexString(childHash),
  }
}


const button = document.getElementById("button");
const buttonConnect = document.getElementById("buttonConnect");


buttonConnect.addEventListener("click", async () => {
  const accounts = await window["ethereum"].request({
    "method": "eth_requestAccounts",
  });

  window["account"] = accounts[0]
});


button.addEventListener("click", async () => {
  const result = await window["ethereum"].request({
    "method": "eth_signTypedData_v4",
    "params": [
      window["account"],
      typedData
    ]
  });
  console.log(result)
});


/*
 * Solidity side
 * X = hashStruct(originalStruct)
 * hash = keccak256(\x19\x01 || DOMAIN_SEP_A || hashStruct(
 *     { childHash: keccak256(\x19\x01 || DOMAIN_SEP_B || X )
 *       child: X 
 *     }))
 */
