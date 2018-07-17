const BigNumber = web3.BigNumber;
var ethUtil = require('ethereumjs-util')
var Tx = require('ethereumjs-tx');
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import expectThrow from './helpers/expectThrow';

var VoteFactory = artifacts.require("./VoteFactory.sol");

contract('VoteFactory', function(accounts) {
    var voteFactory;

    const owner = accounts[0];
    const creator = accounts[1];
    const user = accounts[2];
    const user2 = accounts[3];
    const user3 = accounts[4];
    const user4 = accounts[5];

    const question0 = "Question 0";
    const question1 = "Question 1";
    const answer0 = "Answer 0";
    const answer1 = "Answer 1";
    const answer2 = "Answer 2"
    const one = "1";
    const zero = "0";
    const multipleLiders = "It is impossible to determine, because multiple voting leaders";

    beforeEach('setup contract for each test', async function () {
        voteFactory = await VoteFactory.new({from: owner});
    });

    it('vote created', async function () {
        await voteFactory.createVote(question0, {from: creator});
        var vote = await voteFactory.voteQuestion(0);
        vote.should.be.equal(question0);
    });

    it('vote initial: answer added by creator', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        var vote = await voteFactory.voteAnswer(0, 0);
        vote.should.be.equal(answer0);
    });

    it('(ET) vote initial: answer added by user', async function () {
        await voteFactory.createVote(question0, {from: creator});
        await expectThrow(voteFactory.addAnswer(0, answer0, {from: user}));
    });

    it('vote initial -> started -> stopped', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.stopVote(0, {from: creator});
    });

    if('(ET) vote started: answers < 2', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await expectThrow(voteFactory.startVote(0, {from:creator}));
    });

    it('(ET) vote stopped: vote do not initial', async function() {
        await expectThrow(voteFactory.stopVote(0, {from: creator}));
    });

    it('(ET) vote stopped: vote do not started', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await expectThrow(voteFactory.stopVote(0, {from: creator}));
    });

    it('(ET) vote started: add answer', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await expectThrow(voteFactory.addAnswer(0, answer2, {from: creator}));
    });

    it('transfer ownership by owner', async function() {
        await voteFactory.transferOwnership(user, {from: owner});
        var newOwner = await voteFactory.contractOwner();
        newOwner.should.be.equal(user);
    });

    it('(ET) transfer ownership by user', async function() {
        await expectThrow(voteFactory.transferOwnership(creator, {from: user}));
    });

    it('vote initial: change question by creator', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.setQuestion(0, question1, {from: creator});
        var vote = await voteFactory.voteQuestion(0);
        vote.should.be.equal(question1);
    });

    it('vote initial: change question by user', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await expectThrow(voteFactory.setQuestion(0, question1, {from: user}));
    });

    it('(ET) vote started: change question by creator', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await expectThrow(voteFactory.setQuestion(0, question1, {from: creator}));
    });

    it('vote initial: change answer by creator', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.setAnswer(0, 0, answer1, {from: creator});
        var answer = await voteFactory.voteAnswer(0, 0);
        answer.should.be.equal(answer1);
    });

    it ('(ET) vote started: change answer by creator', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await expectThrow(voteFactory.setAnswer(0, 0, answer1, {from: creator}));
    });

    it('voting', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        var state = await voteFactory.voteState(0);
        one.should.be.equal(state.toString());

        await voteFactory.cast(0, 1, {from: user});
        var i = await voteFactory.voterAnswerId(user, 0);
        one.should.be.equal(i.toString());
        var addr = await voteFactory.voterAddress(0, 0);
        addr.should.be.equal(user);
    });
    
    it('unchanged voting', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 1, {from: user});
        await voteFactory.cast(0, 0, {from: user});
        var i = await voteFactory.voterAnswerId(user, 0);
        one.should.be.equal(i.toString());
    });

    it('vote started: answer0 - 2 vote, answer1 - 1 vote', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 0, {from: user2});
        await voteFactory.cast(0, 0, {from: user3});
        await voteFactory.cast(0, 1, {from: user4});
        var res = await voteFactory.results(0);
        res.should.be.equal(answer0);
    });

    it('vote started: answer0 - 1 vote, answer1 - 1 vote', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 0, {from: user2});
        await voteFactory.cast(0, 1, {from: user4});
        var res = await voteFactory.results(0);
        res.should.be.equal(multipleLiders);
    });

    it('vote started: user vote only one', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 0, {from: user2});
        await voteFactory.cast(0, 0, {from: user3});
        await voteFactory.cast(0, 1, {from: user4});
        await voteFactory.cast(0, 1, {from: user4});
        await voteFactory.cast(0, 1, {from: user4});
        var res = await voteFactory.results(0);
        res.should.be.equal(answer0);
    });

    it('vote started: vote only one', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 0, {from: user});
        var res0 = await voteFactory.voterAnswerId(user, 0);
        zero.should.be.equal(res0.toString());
        await voteFactory.cast(0, 1, {from: user});
        var res = await voteFactory.voterAnswerId(user, 0);
        zero.should.be.equal(res.toString());
    });

    it('several vote', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await voteFactory.addAnswer(0, answer1, {from: creator});
        await voteFactory.startVote(0, {from: creator});
        await voteFactory.cast(0, 0, {from: user});
        var res0 = await voteFactory.voterAnswerId(user, 0);
        zero.should.be.equal(res0.toString());

        await voteFactory.createVote(question1, {from: creator});
        await voteFactory.addAnswer(1, answer0, {from: creator});
        await voteFactory.addAnswer(1, answer1, {from: creator});
        await voteFactory.startVote(1, {from: creator});
        await voteFactory.cast(1, 1, {from: user});
        var res1 = await voteFactory.voterAnswerId(user, 1);
        one.should.be.equal(res1.toString());
    });

    it('(ET) vote initial: get result', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await expectThrow(voteFactory.results(0));
    });

    it('(ET) vote initial: voting', async function() {
        await voteFactory.createVote(question0, {from: creator});
        await voteFactory.addAnswer(0, answer0, {from: creator});
        await expectThrow(voteFactory.cast(0, 0, {from: user}));
    });
});
