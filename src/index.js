const crypto = require('crypto');

class Transaction{
    constructor(number, payer, payee){
        this.number = number;
        this.payer = payer;
        this.payee = payee;
    }

    toString(){
        return JSON.stringify(this);
    }

};

class Block {

    nonce = Math.round(Math.random() * 999999999);

    constructor(prevHash) {
        this.prevHash = prevHash;
    }

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

};

class Chain {
    static instance = new Chain(); //   Singleton instance

    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }

    mine(nonce){
        let solution = 1;
        console.log('... mining ...');

        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substring(0, 4) == '0000'){
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }

    addBlock(transaction, senderPublicKey, signature){
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }


    }

};

class Wallet{
    publicKey;
    privateKey;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount, payeePublicKey){
        const transaction = new Transaction((amount, this.publicKey, payeePublicKey));
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

const satoshi = new Wallet();
const bob = new Wallet();
const andre = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, andre.publicKey);
andre.sendMoney(5, bob.publicKey);

console.log(Chain.instance);