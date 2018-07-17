pragma solidity ^0.4.24;

import "./Ownable.sol";

contract VoteFactory is Ownable {
    
    struct Vote {
        string question;
        string[] answers;
        State state;
        address[] voters;
        mapping (address => uint) voterToAnswer;
    }

    enum State {
        Initial,
        Started,
        Stopped
    }
    
    Vote[] public votes;
    mapping (uint => address) voteToOwner;
    

    modifier onlyVoteOwner(uint _voteId) {
        require(voteToOwner[_voteId] == msg.sender);
        _;
    }

    modifier voteInitial(uint _voteId) {
        require(votes[_voteId].state == State.Initial);
        _;
    }

    modifier voteStarted(uint _voteId) {
        require(votes[_voteId].state == State.Started);
        _;
    }

    modifier voteStopped(uint _voteId) {
        require(votes[_voteId].state == State.Stopped);
        _;
    }


    function createVote(string _question) public {
        uint voteId = votes.push(Vote(_question, new string[](0), State.Initial, new address[](0))) - 1;
        voteToOwner[voteId] = msg.sender;
    }

    function setQuestion(uint _voteId, string _question)
    public
    onlyVoteOwner(_voteId)
    voteInitial(_voteId) {
        votes[_voteId].question = _question;
    }
    
    function addAnswer(uint _voteId, string _answer)
    public
    onlyVoteOwner(_voteId)
    voteInitial(_voteId) {
        require(voteToOwner[_voteId] == msg.sender);
        votes[_voteId].answers.push(_answer);
    }

    function setAnswer(uint _voteId, uint _answerId, string _answer)
    public
    onlyVoteOwner(_voteId)
    voteInitial(_voteId) {
        votes[_voteId].answers[_answerId] = _answer;
    }

    function startVote(uint _voteId)
    public
    onlyVoteOwner(_voteId)
    voteInitial(_voteId) {
        require(votes[_voteId].answers.length > 1);
        votes[_voteId].state = State.Started;
    }

    function stopVote(uint _voteId)
    public
    onlyVoteOwner(_voteId)
    voteStarted(_voteId) {
        votes[_voteId].state = State.Stopped;
    }
    
    function cast(uint _voteId, uint _answerId) public voteStarted(_voteId) {
        for (uint i = 0; i < votes[_voteId].voters.length; i++) {
            if (votes[_voteId].voters[i] == msg.sender) {
                return;
            }
        }
        votes[_voteId].voterToAnswer[msg.sender] = _answerId;
        votes[_voteId].voters.push(msg.sender);
    }

    function _results(uint _voteId) internal view returns(uint, uint) {
        require(votes[_voteId].voters.length > 0);
        uint[] memory counts = new uint[](votes[_voteId].voters.length);
        for (uint i = 0; i < votes[_voteId].voters.length; i++) {
            counts[votes[_voteId].voterToAnswer[votes[_voteId].voters[i]]]++;
        }
        uint index = 0;
        uint count = 0;
        for (i = 0; i < counts.length; i++) {
            if (counts[i] > counts[index]) {
                index = i;
                count = 0;
            }
            if (counts[i] == counts[index]) {
                count++;
            }
        }
        return (index, count);
    }

    function results(uint _voteId) public view returns(string) {
        uint index;
        uint count;
        (index, count) = _results(_voteId);
        if (count > 1) {
            return "It is impossible to determine, because multiple voting leaders";
        }
        return votes[_voteId].answers[index];
    }


    function voteQuestion(uint _voteId) public view returns(string) {
        return votes[_voteId].question;
    }

    function voteAnswer(uint _voteId, uint _answerId) public view returns(string) {
        return votes[_voteId].answers[_answerId];
    }

    function voteState(uint _voteId) public view returns(State) {
        return votes[_voteId].state;
    }

    function contractOwner() public view returns(address) {
        return owner;
    }

    function voterAnswerId(address _voter, uint _voteId) public view returns(uint) {
        return votes[_voteId].voterToAnswer[_voter];
    }

    function voterAddress(uint _voteId, uint _voterId) public view returns(address) {
        return votes[_voteId].voters[_voterId];
    }
}
