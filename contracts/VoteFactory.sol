pragma solidity ^0.4.19;

import "./Ownable.sol";

contract VoteFactory is Ownable{
    
    struct Vote {
        string question;
        string[] answers;
        State state;
    }

    enum State {
        Initial,
        Started,
        Stopped
    }
    
    Vote[] public votes;
    mapping (uint => address) voteToOwner;
    

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
        uint voteId = votes.push(Vote(_question, new string[](0), State.Initial)) - 1;
        voteToOwner[voteId] = msg.sender;
    }
    
    function addAnswer(uint _voteId, string _answer) public voteInitial(_voteId) {
        require(voteToOwner[_voteId] == msg.sender);
        votes[_voteId].answers.push(_answer);
    }

    function startVote(uint _voteId) public voteInitial(_voteId) {
        require(voteToOwner[_voteId] == msg.sender);
        require(votes[_voteId].answers.length > 1);
        votes[_voteId].state = State.Started;
    }

    function stopVote(uint _voteId) public voteStarted(_voteId) {
        require(voteToOwner[_voteId] == msg.sender);
        votes[_voteId].state = State.Stopped;
    }


    function voteQuestion(uint _voteId) public view returns(string) {
        return votes[_voteId].question;
    }

    function voteAnswer(uint _voteId, uint _answerId) public view returns(string) {
        return votes[_voteId].answers[_answerId];
    }
}
