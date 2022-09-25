const { Contract } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const { check } = require("prettier");
const abi =
    require("../artifacts/contracts/tracks/TracksTreasury.sol/TreasuryContract.json").abi;

const PROXY = "0xCF2F55c2002Bb4DD5506a75D7C4F401cb2dDcC4F";
const BNB = '0x0000000000000000000000000000000000000000'
const LBL_TOKEN = '0xd375fdaba3dba88c160a278d01c68ddc8f46d549'
const BLB_TOKEN = '0x4c17dbc1f2406886b63c463585226a8f04cec27e'
const MYSTERYBOX = '0x9f3Af0E8482164a2890E9312B7638e5c2B9A218C'
const HEADPHONE = '0xfa067668f4ef5588a7a66d213ad2c5e376b04b16'
const HEADPHONEBOX = '0x847b500692268587d7db3793f88e07ff52849376'
const PINBALLHEAD = '0x8f74b37fcaef4434b74bcd8573ed758ce5c184bc'

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
    //     .then(async (tx) => {
    //         console.log(tx.hash);
    //         await tx.wait();
    //         console.log(tx);
    //         console.log("Transaction mined!");
    //     }
    //     ).catch((error) => {
    //         console.error(error);
    //         process.exitCode = 1;
    //     }
    //     );

    // // Deposit Token(LBL/BLB ...)
    await treasuryContract.depositToken(BLB_TOKEN, ethers.utils.parseEther('1000'), 1)
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

    // Deposit NFT(Mystery Box / Headphone ...)
    // treasuryContract.depositNft(PINBALLHEAD, 0, 1)
    //     .then(async (tx) => {
    //         console.log(tx.hash);
    //         await tx.wait();
    //         console.log(tx);
    //         console.log("Transaction mined!");
    //     }
    //     ).catch((error) => {
    //         console.error(error);
    //         process.exitCode = 1;
    //     }
    //     );

}

async function makeSignWithString() {
    [owner] = await ethers.getSigners();
    // make sign with data
    const signedMessage = await owner.signMessage("LABEL_TRACKS");

    console.log(signedMessage);
}


main();
// makeSignWithString()