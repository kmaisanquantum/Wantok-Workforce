const UserModel = require('../../auth/models/user_model');

class CustomerController {
    static async updateFullProfile(req, res) {
        let client;
        try {
            const userId = req.user.id;
            const { name, phone_number, whatsapp_number, physical_address, saved_locations } = req.body;

            client = await UserModel.getPool().connect();
            await client.query('BEGIN');

            const updateQuery = `
                UPDATE users
                SET name = COALESCE($1, name),
                    phone_number = COALESCE($2, phone_number),
                    whatsapp_number = COALESCE($3, whatsapp_number),
                    physical_address = COALESCE($4, physical_address),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING id, name, email, phone_number, whatsapp_number, physical_address
            `;

            const { rows } = await client.query(updateQuery, [name, phone_number, whatsapp_number, physical_address, userId]);
            const updatedUser = rows[0];

            if (saved_locations && Array.isArray(saved_locations)) {
                // If any new location is default, unset others
                if (saved_locations.some(loc => loc.is_default)) {
                    await client.query('UPDATE customer_saved_locations SET is_default = false WHERE customer_id = $1', [userId]);
                }

                for (const loc of saved_locations) {
                    const lat = loc.latitude || loc.lat;
                    const lon = loc.longitude || loc.lon;
                    const label = loc.label || loc.location_label;
                    const address = loc.address || loc.address_line;

                    if (label && address) {
                        await client.query(`
                            INSERT INTO customer_saved_locations (customer_id, location_label, address_line, coordinates, is_default)
                            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
                        `, [userId, label, address, lon, lat, loc.is_default || false]);
                    }
                }
            }

            await client.query('COMMIT');
            return res.status(200).json({
                success: true,
                message: 'E-commerce contact profile securely updated.',
                data: updatedUser
            });
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Update Customer Profile Error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        } finally {
            if (client) client.release();
        }
    }

    static async getSavedLocations(req, res) {
        try {
            const userId = req.user.id;
            const query = 'SELECT id, location_label, address_line, ST_X(coordinates::geometry) as longitude, ST_Y(coordinates::geometry) as latitude, is_default FROM customer_saved_locations WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC';
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
                await UserModel.getPool().query('UPDATE customer_saved_locations SET is_default = false WHERE customer_id = $1', [userId]);
            }

            const query = `
                INSERT INTO customer_saved_locations (customer_id, location_label, address_line, coordinates, is_default)
                VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
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
            await UserModel.getPool().query('DELETE FROM customer_saved_locations WHERE id = $1 AND customer_id = $2', [locationId, userId]);
            return res.status(200).json({ success: true, message: 'Location deleted' });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete location' });
        }
    }
}

module.exports = CustomerController;
