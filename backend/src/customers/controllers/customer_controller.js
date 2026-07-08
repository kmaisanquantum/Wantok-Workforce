const UserModel = require('../../auth/models/user_model');

class CustomerController {
    static async updateFullProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, phone_number, whatsapp_number, physical_address } = req.body;

            const query = `
                UPDATE users
                SET name = COALESCE(, name),
                    phone_number = COALESCE(, phone_number),
                    whatsapp_number = COALESCE(, whatsapp_number),
                    physical_address = COALESCE(, physical_address),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id =
                RETURNING id, name, email, phone_number, whatsapp_number, physical_address
            `;

            const { rows } = await UserModel.getPool().query(query, [name, phone_number, whatsapp_number, physical_address, userId]);

            return res.status(200).json({
                success: true,
                message: 'Customer profile updated successfully',
                data: rows[0]
            });
        } catch (error) {
            console.error('Update Customer Profile Error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    static async getSavedLocations(req, res) {
        try {
            const userId = req.user.id;
            const query = 'SELECT id, location_label, address_line, ST_X(coordinates::geometry) as longitude, ST_Y(coordinates::geometry) as latitude, is_default FROM customer_saved_locations WHERE customer_id =  ORDER BY is_default DESC, created_at DESC';
            const { rows } = await UserModel.getPool().query(query, [userId]);
            return res.status(200).json({ success: true, data: rows });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch saved locations' });
        }
    }

    static async addSavedLocation(req, res) {
        try {
            const userId = req.user.id;
            const { label, address, longitude, latitude, is_default } = req.body;

            if (is_default) {
                await UserModel.getPool().query('UPDATE customer_saved_locations SET is_default = false WHERE customer_id = ', [userId]);
            }

            const query = `
                INSERT INTO customer_saved_locations (customer_id, location_label, address_line, coordinates, is_default)
                VALUES (, , , ST_SetSRID(ST_MakePoint(, ), 4326), )
                RETURNING id, location_label, address_line, is_default
            `;

            const { rows } = await UserModel.getPool().query(query, [userId, label, address, longitude, latitude, is_default || false]);

            return res.status(201).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Add Saved Location Error:', error);
            return res.status(500).json({ error: 'Failed to add location' });
        }
    }

    static async deleteSavedLocation(req, res) {
        try {
            const userId = req.user.id;
            const { locationId } = req.params;
            await UserModel.getPool().query('DELETE FROM customer_saved_locations WHERE id =  AND customer_id = ', [locationId, userId]);
            return res.status(200).json({ success: true, message: 'Location deleted' });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete location' });
        }
    }
}

module.exports = CustomerController;
