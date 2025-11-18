# ShadowBridge Ethereum Deployments

| Network | WrappedToken | BridgeReceiver | Notes |
|---------|--------------|----------------|-------|
| Hardhat local | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | Output from `npx hardhat run scripts/deploy.ts` |
| Sepolia (Nov 17, 2025) | `0xDA9b99B67da148125106208D9A25E642eeF5Bf1c` | `0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89` | Run via `npx hardhat run --network sepolia scripts/deploy.ts` |

After deploying, update the relayer `.env` with:

```
ETHEREUM_BRIDGE_ADDRESS=0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89
```

and the frontend `.env` with:

```
VITE_ETHEREUM_BRIDGE_CONTRACT=0xeA6E9c1cfAd01C7DfD631827AD4dE4206043FB89
```

