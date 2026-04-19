import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CampusGovABI from "./abi/CampusGov.json";
import CGOVTokenABI from "./abi/CGOVToken.json";
import { CAMPUS_GOV_ADDRESS, CGOV_TOKEN_ADDRESS } from "./config";

export default function App() {
  const [account, setAccount] = useState("");
  const [campusGov, setCampusGov] = useState(null);
  const [proposalCount, setProposalCount] = useState(0);
  const [proposals, setProposals] = useState([]);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [tokenBalance, setTokenBalance] = useState("0");

  const [expandedProposalId, setExpandedProposalId] = useState(null);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask first.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const gov = new ethers.Contract(
        CAMPUS_GOV_ADDRESS,
        CampusGovABI.abi,
        signer
      );

      const token = new ethers.Contract(
        CGOV_TOKEN_ADDRESS,
        CGOVTokenABI.abi,
        signer
      );

      setAccount(address);
      setCampusGov(gov);
      setStatus("Wallet connected");

      await loadTokenBalance(token, address);
      await loadProposals(gov);
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect wallet");
    }
  }

  async function refreshData() {
    if (!campusGov || !account) {
      setStatus("Please connect wallet first");
      return;
    }
    setStatus("Refreshing data...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const token = new ethers.Contract(
        CGOV_TOKEN_ADDRESS,
        CGOVTokenABI.abi,
        provider
      );
      
      await loadTokenBalance(token, account);
      await loadProposals(); 
      setStatus("Data refreshed successfully");
    } catch (err) {
      console.error(err);
      setStatus("Failed to refresh data");
    }
  }

  async function loadTokenBalance(token, address) {
    try {
      const balance = await token.balanceOf(address);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProposals(contract = campusGov) {
    try {
      if (!contract) return;

      const count = await contract.proposalCount();
      const countNum = Number(count);
      setProposalCount(countNum);

      const temp = [];
      for (let i = 1; i <= countNum; i++) {
        const p = await contract.getProposal(i);
        temp.push({
          id: Number(p[0]),
          description: p[1],
          startTime: Number(p[2]),
          endTime: Number(p[3]),
          yesVotes: Number(p[4]),
          noVotes: Number(p[5]),
          isClosed: p[6],
          creator: p[7],
        });
      }

      temp.reverse();
      setProposals(temp);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load proposals");
    }
  }

  async function handleCreateProposal(e) {
    e.preventDefault();
    try {
      if (!campusGov) return;
      setStatus("Creating proposal...");

      const tx = await campusGov.createProposal(description, duration);
      await tx.wait();

      setDescription("");
      setDuration("");
      setStatus("Proposal created successfully");
      await loadProposals();
    } catch (err) {
      console.error(err);
      setStatus(err?.reason || err?.shortMessage || "Failed to create proposal");
    }
  }

  async function handleVote(id, voteYes) {
    try {
      if (!campusGov) return;
      setStatus("Submitting vote...");

      const tx = await campusGov.vote(id, voteYes);
      await tx.wait();

      setStatus("Vote submitted successfully");
      await loadProposals();
    } catch (err) {
      console.error(err);
      setStatus(err?.reason || err?.shortMessage || "Failed to vote");
    }
  }

  async function handleCloseProposal(id) {
    try {
      if (!campusGov) return;
      setStatus("Closing proposal...");

      const tx = await campusGov.closeProposal(id);
      await tx.wait();

      setStatus("Proposal closed successfully");
      await loadProposals();
    } catch (err) {
      console.error(err);
      setStatus(err?.reason || err?.shortMessage || "Failed to close proposal");
    }
  }

  function formatTime(ts) {
    return new Date(ts * 1000).toLocaleString();
  }

  function isExpired(endTime) {
    return Math.floor(Date.now() / 1000) >= endTime;
  }

  const toggleDetails = (id) => {
    setExpandedProposalId(expandedProposalId === id ? null : id);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>CampusGov dApp</h1>
      <p>DAO-style voting demo on localhost</p>

      <div style={cardStyle}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button onClick={connectWallet} style={primaryBtn}>
            {account ? "Wallet Connected" : "Connect Wallet"}
          </button>
          
          <button 
            onClick={refreshData} 
            disabled={!account}
            style={{ 
              ...btnBase, 
              background: !account ? "#ccc" : "#f39c12", 
              color: "white" 
            }}
          >
            Refresh Status
          </button>
        </div>
        
        <p style={{ margin: "8px 0" }}><strong>Status:</strong> {status}</p>
        <p style={{ margin: "8px 0" }}><strong>Account:</strong> {account || "Not connected"}</p>
        <p style={{ margin: "8px 0" }}><strong>CGOV Balance:</strong> {tokenBalance}</p>
      </div>

      <div style={cardStyle}>
        <h2>Create Proposal</h2>
        <form onSubmit={handleCreateProposal} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            rows="4"
            placeholder="Enter proposal description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            min="1"
            placeholder="Duration in minutes"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={primaryBtn}>Create Proposal</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h2>All Proposals ({proposalCount})</h2>

        {proposals.length === 0 ? (
          <p>No proposals yet.</p>
        ) : (
          proposals.map((proposal) => {
            const expired = isExpired(proposal.endTime);
            const closed = proposal.isClosed;

            return (
              <div key={proposal.id} style={proposalStyle}>
                <h3>Proposal #{proposal.id}</h3>
                <p><strong>Description:</strong> {proposal.description}</p>
                <p><strong>Creator:</strong> {proposal.creator}</p>
                <p><strong>Start:</strong> {formatTime(proposal.startTime)}</p>
                <p><strong>End:</strong> {formatTime(proposal.endTime)}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {closed
                    ? "Closed"
                    : expired
                    ? "Expired (can be closed)"
                    : "Active"}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={closed || expired}
                    style={{ ...btnBase, background: closed || expired ? "#ccc" : "#1f9d55", color: "white" }}
                  >
                    Vote Yes
                  </button>

                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={closed || expired}
                    style={{ ...btnBase, background: closed || expired ? "#ccc" : "#d64545", color: "white" }}
                  >
                    Vote No
                  </button>

                  <button
                    onClick={() => handleCloseProposal(proposal.id)}
                    disabled={closed || !expired}
                    style={{ ...btnBase, background: closed || !expired ? "#ccc" : "#444", color: "white" }}
                  >
                    Close Proposal
                  </button>
                </div>

                {(expired || closed) && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                    <button
                      onClick={() => toggleDetails(proposal.id)}
                      style={{ ...btnBase, background: "#6c757d", color: "white", width: "100%" }}
                    >
                      {expandedProposalId === proposal.id ? "Hide Details ↑" : "View Final Results ↓"}
                    </button>

                    {expandedProposalId === proposal.id && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                        <p style={{ margin: "4px 0" }}>Yes Votes: <strong>{proposal.yesVotes}</strong></p>
                        <p style={{ margin: "4px 0" }}>No Votes: <strong>{proposal.noVotes}</strong></p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: "bold" }}>
                          Final Result: {
                            proposal.yesVotes > proposal.noVotes 
                              ? "Proposal Passed" 
                              : proposal.yesVotes === proposal.noVotes
                                ? "Vote Tied (Proposal Rejected)" 
                                : "Proposal Rejected"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const proposalStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "16px",
  marginTop: "16px"
};

const inputStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "14px"
};

const btnBase = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "opacity 0.2s"
};

const primaryBtn = {
  ...btnBase,
  background: "#2f6fed",
  color: "white"
};