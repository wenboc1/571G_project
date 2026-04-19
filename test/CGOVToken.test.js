const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CGOVToken", function () {
  let token;
  let owner;
  let user1;
  let user2;

  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const CGOVToken = await ethers.getContractFactory("CGOVToken");
    token = await CGOVToken.deploy(initialSupply);
    await token.waitForDeployment();
  });

  it("should set the correct token name and symbol", async function () {
    expect(await token.name()).to.equal("Campus Governance Token");
    expect(await token.symbol()).to.equal("CGOV");
  });

  it("should mint the initial supply to the owner", async function () {
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("should allow token transfers", async function () {
    const transferAmount = ethers.parseUnits("100", 18);

    await token.transfer(user1.address, transferAmount);

    expect(await token.balanceOf(user1.address)).to.equal(transferAmount);
  });

  it("should allow owner to mint new tokens", async function () {
    const mintAmount = ethers.parseUnits("500", 18);

    await token.mint(user1.address, mintAmount);

    expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
  });

  it("should not allow non-owner to mint new tokens", async function () {
    const mintAmount = ethers.parseUnits("500", 18);

    await expect(
      token.connect(user1).mint(user2.address, mintAmount)
    ).to.be.reverted;
  });
});