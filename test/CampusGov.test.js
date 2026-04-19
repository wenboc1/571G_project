const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CampusGov", function () {
  let cgovToken;
  let campusGov;
  let owner;
  let voter1;
  let voter2;
  let other;

  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, voter1, voter2, other] = await ethers.getSigners();

    const CGOVToken = await ethers.getContractFactory("CGOVToken");
    cgovToken = await CGOVToken.deploy(initialSupply);
    await cgovToken.waitForDeployment();
    const tokenAddress = await cgovToken.getAddress();

    const CampusGov = await ethers.getContractFactory("CampusGov");
    campusGov = await CampusGov.deploy(tokenAddress);
    await campusGov.waitForDeployment();

    await cgovToken.transfer(voter1.address, ethers.parseUnits("200", 18));
    await cgovToken.transfer(voter2.address, ethers.parseUnits("200", 18));
  });

  it("should set the deployer as owner", async function () {
    expect(await campusGov.owner()).to.equal(owner.address);
  });

  it("should allow a user with enough tokens to create a proposal", async function () {
    await campusGov.connect(voter1).createProposal("Launch Campus Vote", 10);

    expect(await campusGov.proposalCount()).to.equal(1);

    const proposal = await campusGov.getProposal(1);
    expect(proposal[0]).to.equal(1); // id
    expect(proposal[1]).to.equal("Launch Campus Vote"); // description
    expect(proposal[7]).to.equal(voter1.address); // creator
  });

  it("should NOT allow a user without tokens to create a proposal", async function () {
    await expect(
      campusGov.connect(other).createProposal("Unauthorized Proposal", 10)
    ).to.be.revertedWith("Insufficient CGOV to propose");
  });

  it("should allow a user to vote yes", async function () {
    await campusGov.connect(owner).createProposal("Proposal A", 10);

    await campusGov.connect(voter1).vote(1, true);

    const proposal = await campusGov.getProposal(1);
    expect(proposal[4]).to.equal(1); // yesVotes
    expect(await campusGov.hasVoted(1, voter1.address)).to.equal(true);
  });

  it("should not allow double voting", async function () {
    await campusGov.connect(owner).createProposal("Proposal C", 10);

    await campusGov.connect(voter1).vote(1, true);

    await expect(
      campusGov.connect(voter1).vote(1, false)
    ).to.be.revertedWith("You have already voted");
  });

  it("should allow anyone to close a proposal AFTER time ends", async function () {
    await campusGov.connect(owner).createProposal("Proposal E", 10);

    await time.increase(11 * 60);

    await campusGov.connect(voter1).closeProposal(1);

    const proposal = await campusGov.getProposal(1);
    expect(proposal[6]).to.equal(true); // isClosed
  });

  it("should NOT allow closing a proposal BEFORE time ends", async function () {
    await campusGov.connect(owner).createProposal("Proposal F", 10);

    await expect(
      campusGov.closeProposal(1)
    ).to.be.revertedWith("Voting period has not ended yet");
  });

  it("should NOT allow voting after time ends", async function () {
    await campusGov.connect(owner).createProposal("Proposal G", 10);
    
    await time.increase(11 * 60);

    await expect(
      campusGov.connect(voter1).vote(1, true)
    ).to.be.revertedWith("Voting period has ended");
  });
  it("should NOT allow creating a proposal with an empty description", async function () {
    await expect(
      campusGov.connect(voter1).createProposal("", 10)
    ).to.be.revertedWith("Description cannot be empty");
  });
  it("should NOT allow creating a proposal with zero duration", async function () {
    await expect(
      campusGov.connect(voter1).createProposal("Invalid Duration Proposal", 0)
    ).to.be.revertedWith("Duration must be greater than zero");
  });
  it("should NOT allow voting on a non-existent proposal", async function () {
    await expect(
      campusGov.connect(voter1).vote(999, true)
    ).to.be.revertedWith("Proposal does not exist");
  });

  it("should NOT allow closing a non-existent proposal", async function () {
    await expect(
      campusGov.connect(voter1).closeProposal(999)
    ).to.be.revertedWith("Proposal does not exist");
  });
  it("should correctly record a NO vote", async function () {
    await campusGov.connect(owner).createProposal("Proposal for NO vote", 10);

    await campusGov.connect(voter2).vote(1, false);

    const proposal = await campusGov.getProposal(1);
    expect(proposal[5]).to.equal(1);
    expect(proposal[4]).to.equal(0);
  });
  it("should NOT allow closing a proposal that is already closed", async function () {
    await campusGov.connect(owner).createProposal("Proposal H", 10);
 
    await time.increase(11 * 60);

    await campusGov.connect(voter1).closeProposal(1);

    await expect(
      campusGov.connect(voter1).closeProposal(1)
    ).to.be.revertedWith("Proposal is already closed");
  });
});