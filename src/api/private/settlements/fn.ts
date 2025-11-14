import { StatusCodes } from "http-status-codes";
import Settlements from "../../../db/settlements/settlements";

export async function fnAddSettlement(req, res) {
    const issuer = req['user'];

    const { chain_id: chainId, address } = req.body;
    if(!chainId || !address) return res.status(StatusCodes.BAD_REQUEST).json({  });

    const settlement = new Settlements(issuer.userId);
    const response = await settlement.add({
        chainId: chainId,
        address: address
    });
    if(!response) return res.status(StatusCodes.BAD_GATEWAY).json({});
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Successfully added settlement",
        data:response
    });

}

export async function fnFetchSettlements(req, res) {
    const issuer = req["user"];

    const settlement = new Settlements(issuer.userId);

    const response = await settlement.get();
    

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data:response
    });

}

export async function fnUpdateSettlement(req, res) {
    const issuer = req["user"];
    const { id } = req.params;

    const { address = null, is_active: isActive = null } = req.body;

    if(!address && !isActive) return res.status(StatusCodes.BAD_REQUEST).json({});
    
    const settlement = new Settlements(issuer.userId);

    const response = await settlement.update({
        chainId: id,
        address: address,
        isActive: isActive
    });

    if(!response){
        return res.status(StatusCodes.BAD_GATEWAY).json({})
    }


    return res.status(StatusCodes.OK).json({
        success: true,
        message: "success",
        data: response
    });


}