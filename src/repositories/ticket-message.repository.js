const TicketMessage = require('../models/ticket-message.model');

class TicketMessageRepository {

    async createMessage(data) {
        const message = new TicketMessage(data);
        return await message.save();
    }

    // includeInternal: true cho staff/admin, false cho customer
    async findMessagesByTicket(ticketId, includeInternal = false) {
        const filter = { ticket_id: ticketId };
        if (!includeInternal) filter.is_internal = false;

        return await TicketMessage.find(filter)
            .sort({ createdAt: 1 })
            .populate('sender_id', 'fullname role');
    }
}

module.exports = new TicketMessageRepository();