const { Contract } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const { check } = require("prettier");
const abi =
    require("../artifacts/contracts/tracks/TracksTreasury.sol/TreasuryContract.json").abi;

const PROXY = "0xCF2F55c2002Bb4DD5506a75D7C4F401cb2dDcC4F";
const LABEL_TOKEN= '0xD375FdAba3dBa88C160A278D01C68DDC8F46D549'
const MYSTERYBOX= '0x9f3Af0E8482164a2890E9312B7638e5c2B9A218C'
const BNB = '0x0000000000000000000000000000000000000000'


const userWallet = '0x573D7314F7e019c308118bC5774DC39154dC8Ec0'

async function main() {
    [owner] = await ethers.getSigners();

    const treasuryContract = new ethers.Contract(PROXY, abi, owner);

    // // Deposit BNB
    // await treasuryContract.depositToken(BNB, ethers.utils.parseEther('1'), 1, {
    //     // BNB를 보낼때는 아래 와 같이 value를 설정해야함
    //     // depositToken의 두번째 인자와 숫자가 같아야 함. 틀릴경우 revert
    //     value: ethers.utils.parseEther('1'),
    // })
    // .then(async (tx) => {
    //     console.log(tx.hash);
    //     await tx.wait();
    //     console.log(tx);
    //     console.log("Transaction mined!");
    // }
    // ).catch((error) => {
    //     console.error(error);
    //     process.exitCode = 1;
    // }
    // );

    // // Deposit Token(LBL/BLB ...)
    // await treasuryContract.depositToken(LABEL_TOKEN, ethers.utils.parseEther('1000'), 1)
    // .then(async (tx) => {
    //     console.log(tx.hash);
    //     await tx.wait();
    //     console.log(tx);
    //     console.log("Transaction mined!");
    // }
    // ).catch((error) => {
    //     console.error(error);
    //     process.exitCode = 1;
    // }
    // );

    // Deposit NFT(Mystery Box / Headphone ...)
    treasuryContract.depositNft(MYSTERYBOX, 0, 1)
    .then(async (tx) => {
        console.log(tx.hash);
        await tx.wait();
        console.log(tx);
        console.log("Transaction mined!");
    }
    ).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    }
    );

}

async function checkTokenURI() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    const uri = await mysterybox.tokenURI(100);
    console.log(uri);
}

async function checkTransfer() {
    [owner] = await ethers.getSigners();

    mysterybox = new ethers.Contract(PROXY, abi, owner);

    await mysterybox.transferFrom(owner.address, '0xcEA695c0F108833f347239bB2f05CEF06F6a7658', 9999);
}


main();
// checkTokenURI()
// checkTransfer()