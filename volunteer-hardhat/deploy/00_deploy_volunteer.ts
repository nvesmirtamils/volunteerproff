import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`Deployer: ${deployer}`);

  const badge = await deploy("VolunteerBadge", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 3 : 1
  });

  const proof = await deploy("VolunteerProof", {
    from: deployer,
    args: [badge.address],
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 3 : 1
  });

  log(`VolunteerBadge deployed at ${badge.address}`);
  log(`VolunteerProof deployed at ${proof.address}`);

  // grant VolunteerProof as minter for badge
  const { ethers } = hre;
  const signer = await ethers.getSigner(deployer);
  const badgeContract = await ethers.getContractAt("VolunteerBadge", badge.address, signer);
  const tx = await badgeContract.setMinter(proof.address, true);
  await tx.wait(hre.network.name === "sepolia" ? 3 : 1);
  log(`Grant VolunteerProof as badge minter`);
};

export default func;
func.tags = ["volunteer"];


