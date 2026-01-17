<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FirebaseService;

class TestFirebaseConnection extends Command
{
    protected $signature = 'firebase:test';
    protected $description = 'Test Firebase connection and fetch data';

    public function handle(FirebaseService $firebase)
    {
        $this->info('🔥 Testing Firebase Connection...');
        $this->newLine();

        try {
            // Test 1: Get all buses
            $this->info('📦 Fetching all buses...');
            $buses = $firebase->getAllBuses();
            $this->info('✅ Found ' . count($buses) . ' buses');
            $this->newLine();

            // Test 2: Get stats
            $this->info('📊 Fetching dashboard stats...');
            $stats = $firebase->getDashboardStats();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Buses', $stats['total_buses']],
                    ['Active Buses', $stats['active_buses']],
                    ['Total Passengers', $stats['total_passengers']],
                    ['Total Capacity', $stats['total_capacity']],
                    ['Average Speed', $stats['average_speed'] . ' km/h'],
                ]
            );
            $this->newLine();

            // Test 3: List buses
            if (!empty($buses)) {
                $this->info('🚌 Bus List:');
                $busData = [];
                foreach ($buses as $busId => $bus) {
                    $busData[] = [
                        $busId,
                        $bus['plateNumber'] ?? 'N/A',
                        $bus['status'] ?? 'N/A',
                        ($bus['currentPassengers'] ?? 0) . '/' . ($bus['capacity'] ?? 0),
                        ($bus['location']['speed'] ?? 0) . ' km/h'
                    ];
                }
                $this->table(
                    ['Bus ID', 'Plate', 'Status', 'Passengers', 'Speed'],
                    $busData
                );
            }

            $this->newLine();
            $this->info('✅ Firebase connection successful!');
            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Firebase connection failed!');
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}