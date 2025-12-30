const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ymocsuqxlxmuococqoiw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb2NzdXF4bHhtdW9jb2Nxb2l3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTgwMCwiZXhwIjoyMDgyMDY3ODAwfQ.f2oKIqzDp-4od1j3QWbuktrqT2cY3eiiJaOVY2VQWkQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCalendar() {
    try {
        const dataPath = path.join(process.cwd(), 'data', 'portfolio.json');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        if (data.calendar) {
            console.log('Migrating calendar config to Supabase...');
            
            // 기존 설정 삭제
            await supabase.from('calendar_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // 새 설정 인서트
            const { error } = await supabase.from('calendar_config').insert({
                calendar_id: data.calendar.calendarId,
                api_key: data.calendar.apiKey,
                refresh_token: data.calendar.refreshToken,
                oauth_client_id: data.calendar.oauthClientId,
                oauth_client_secret: data.calendar.oauthClientSecret
            });

            if (error) {
                console.error('Insert error:', error.message);
            } else {
                console.log('Calendar configuration migrated successfully!');
            }
        }
    } catch (e) {
        console.error('Migration failed:', e.message);
    }
}

migrateCalendar();




