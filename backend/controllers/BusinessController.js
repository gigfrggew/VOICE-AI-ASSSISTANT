import Business from "../models/BusinessModel.js";

async function CreateBusinessController(req, res) {
    try {

        const { businessName, businessType, phone, description } = req.body;

        const business = await Business.create({
            owner: req.user._id,
            businessName,
            businessType,
            phone,
            description,
        });

        res.status(201).json({
            message: "Business created successfully",
            business: {
                id: business._id,
                businessName: business.businessName,
                businessType: business.businessType,
                phone: business.phone,
                description: business.description,
            },
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Something went wrong while creating the business",
        });
    }
}


async function GetBusinessController(req, res) {
    try {

        const business = await Business.findOne({
            owner: req.user._id
        });

        if (!business) {
            return res.status(404).json({
                message: "Business not found"
            });
        }

        res.status(200).json({
            message: "Business fetched successfully",
            business: {
                id: business._id,
                businessName: business.businessName,
                businessType: business.businessType,
                phone: business.phone,
                description: business.description,
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Something went wrong while fetching the business"
        });
    }
}


export {
    CreateBusinessController,
    GetBusinessController
};