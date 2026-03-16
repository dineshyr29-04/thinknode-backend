const Service = require('../models/serviceModel');

const getServices = async (req, res, next) => {
    try {
        const services = await Service.findAll();
        res.json(services);
    } catch (error) {
        next(error);
    }
};

const createService = async (req, res, next) => {
    try {
        const serviceId = await Service.create(req.body);
        const newService = await Service.findById(serviceId);
        res.status(201).json(newService);
    } catch (error) {
        next(error);
    }
};

const updateService = async (req, res, next) => {
    try {
        const affectedRows = await Service.update(req.params.id, req.body);
        if (affectedRows) {
            const updatedService = await Service.findById(req.params.id);
            res.json(updatedService);
        } else {
            res.status(404);
            throw new Error('Service not found');
        }
    } catch (error) {
        next(error);
    }
};

const deleteService = async (req, res, next) => {
    try {
        const affectedRows = await Service.delete(req.params.id);
        if (affectedRows) {
            res.json({ message: 'Service removed' });
        } else {
            res.status(404);
            throw new Error('Service not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService
};
