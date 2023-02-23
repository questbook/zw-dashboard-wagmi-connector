import { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    Input,
    useColorMode
} from '@chakra-ui/react';
import Head from 'next/head';
import {
    Connector,
    useAccount,
    useConnect,
    useContract,
    useNetwork,
    useSigner
} from 'wagmi';
import { ZeroWalletSigner } from 'zero-wallet-wagmi-connector';
import { addressByChainId, contractAbi, DEFAULT_CHAIN_ID } from '../src/constants/contract';
import { ScwContext } from './_app';

export default function Home() {
    // context
    const { doesScwExist, setDoesScwExist } = useContext(ScwContext)!

    // state
    const [newNumber, setNewNumber] = useState<string>('');
    const [contractNumber, setContractNumber] = useState<number | null>(null);

    // wagmi hooks
    const { chain } = useNetwork()
    const { address } = useAccount();
    const { data: signer } = useSigner<ZeroWalletSigner>();
    const { connect, connectors } = useConnect();
    const contractAddress = addressByChainId[chain?.id || DEFAULT_CHAIN_ID]
    const contract = useContract({
        address: contractAddress,
        abi: contractAbi,
        signerOrProvider: signer
    });

    // chakra hooks
    const { setColorMode } = useColorMode();
    useEffect(() => {
        setColorMode('dark');
        // @ts-ignore
    }, []);

    useEffect(() => {
        console.log("scwAddress", signer?.scwAddress);
    }, [signer?.scwAddress])

    const handleConnect = async (connector: Connector) => {
        connect({ connector: connector });
    };

    useEffect(() => {
        const func = async () => {
            if (signer && !doesScwExist) {
                try {
                    try {
                        await signer.authorize()
                    } catch { }

                    await signer.deployScw()
                    setDoesScwExist(true)
                } catch { }
            }
        }

        func()
    }, [signer, doesScwExist, setDoesScwExist])

    useEffect(() => {
        console.log('chain changed', chain)
    }, [chain])

    const getContractNumber = async () => {
        if (!contract || !signer) return;
        try {
            console.log(contract.functions)
            const newContractNumber = await contract.value();
            console.log(newContractNumber)
            setContractNumber(parseInt(newContractNumber));
        }
        catch{}
    };

    useEffect(() => {
        if (doesScwExist)
            getContractNumber()
    }, [doesScwExist])

    const handleSetNumber = async () => {
        if (!contract) return;
        const tx = await contract.set(parseInt(newNumber));
        await tx?.wait();
        await getContractNumber();
    };

    return (
        <Flex
            justifyContent="center"
            alignItems="center"
            dir="c"
            h="100vh"
            w="100vw"
        >
            <Head>
                <title>Create Next App</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {!signer ? (
                <ButtonGroup>
                    {connectors.map((connector, index) => (
                        <Button
                            key={index}
                            onClick={() => handleConnect(connector)}
                        >
                            Connect {connector.name}
                        </Button>
                    ))}
                </ButtonGroup>
            ) : (
                <Flex alignItems="center" direction="column" gap={5}>
                    <Box>
                        Storage value:{' '}
                        {contractNumber ? contractNumber : 'loading...'}
                    </Box>
                    <Box>
                        Your SCW address: {signer.scwAddress}
                        <br />
                        Your zero wallet address: {address}
                    </Box>
                    <Flex gap={2}>
                        <Input
                            type="number"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                        />
                        <Button onClick={handleSetNumber} padding="5">
                            Set Number
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
}
