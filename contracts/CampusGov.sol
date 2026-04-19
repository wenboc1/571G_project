// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CampusGov {
    address public owner;
    uint256 public proposalCount;
    
    IERC20 public cgovToken;
    uint256 public proposalThreshold = 100 * 10**18; 

    struct Proposal {
        uint256 id;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool isClosed;
        address creator;
    }

    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );

    event ProposalClosed(
        uint256 indexed proposalId,
        uint256 yesVotes,
        uint256 noVotes
    );

    modifier proposalExists(uint256 _proposalId) {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Proposal does not exist"
        );
        _;
    }

    constructor(address _tokenAddress) {
        owner = msg.sender;
        cgovToken = IERC20(_tokenAddress);
    }

    function createProposal(
        string memory _description,
        uint256 _durationInMinutes
    ) external {
        require(cgovToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient CGOV to propose");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_durationInMinutes > 0, "Duration must be greater than zero");

        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            startTime: block.timestamp,
            endTime: block.timestamp + (_durationInMinutes * 1 minutes),
            yesVotes: 0,
            noVotes: 0,
            isClosed: false,
            creator: msg.sender
        });

        emit ProposalCreated(
            proposalCount,
            _description,
            block.timestamp,
            block.timestamp + (_durationInMinutes * 1 minutes),
            msg.sender
        );
    }

    function vote(uint256 _proposalId, bool _support)
        external
        proposalExists(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];

        require(!proposal.isClosed, "Proposal is already closed");
        require(block.timestamp <= proposal.endTime, "Voting period has ended");
        require(!hasVoted[_proposalId][msg.sender], "You have already voted");

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(_proposalId, msg.sender, _support);
    }

    function closeProposal(uint256 _proposalId)
        external
        proposalExists(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];

        require(!proposal.isClosed, "Proposal is already closed");
        require(block.timestamp > proposal.endTime, "Voting period has not ended yet");

        proposal.isClosed = true;

        emit ProposalClosed(
            _proposalId,
            proposal.yesVotes,
            proposal.noVotes
        );
    }

    function getProposal(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            uint256 id,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 yesVotes,
            uint256 noVotes,
            bool isClosed,
            address creator
        )
    {
        Proposal memory proposal = proposals[_proposalId];

        return (
            proposal.id,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.isClosed,
            proposal.creator
        );
    }
}