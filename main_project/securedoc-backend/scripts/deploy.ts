import { network } from "hardhat";

const { ethers } = await network.connect();

const contract = await ethers.deployContract("AuditTrail");

await contract.waitForDeployment();

console.log("AuditTrail deployed to:", await contract.getAddress());