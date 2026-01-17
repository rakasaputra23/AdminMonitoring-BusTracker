<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rute;

class RuteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ruteData = [
            [
                'nama_rute' => 'Madiun - Surabaya',
                'kota_asal' => 'Madiun',
                'kota_tujuan' => 'Surabaya',
                'polyline' => 'pk~lEluxmVmAyCu@wAq@yAo@{Ak@}Ai@_Bg@aBe@cBc@eBa@gB_@iBYkBWmBUoBSqBQsBOuBMwBKyBIyBG{BE}BC_CAaC?cCBeC@gCDiCFkCHmCJoCLqCNsCPuCRwCTyCVyCXyCZyCb@wCd@uCf@sCh@qCj@oCl@mCn@kCp@iCr@gCt@eCv@cCx@aCz@_C|@}B~@yB`AuBbAqBdAmBfAiBhAeBjA_BlA{AnAuApAqArAmAtAiAvAeAxAaAzA}@|Ay@~Au@`BqAbBmAcBiAeBeBgBaBeB_BiBYiBWkBUmBSoBQqBOsBMuBKwBIyBGyBE{BC}BA_CAaC?aC@cCBeCDgCFiCHkCJmCLoCNqCPsCRuCTwCVyCXyCZyCb@wCd@uCf@sCh@qCj@oCl@mCn@kCp@iCr@gCt@eCv@cCx@aCz@_C|@}B~AyBbAuBdAqBfAmBhAiBjAeBl@_BnA{ApAuArAqAtAmAvAiAxAeAzAaA|A}@~Ay@`BuAbBqAcBmAeBiBgBaBeBYiBWiBUkBSmBQoBOqBMsBKuBIwBGwBEyBC{BA}B?_C@aC@cCBeCDgCFiCHkCJmCLoCNqCPsCRuCTwCVyCXyC',
                'track_coordinates' => json_encode([
                    ["lat" => -7.604046, "lng" => 111.534358],
                    ["lat" => -7.598000, "lng" => 111.565000],
                    ["lat" => -7.592000, "lng" => 111.595000],
                    ["lat" => -7.585000, "lng" => 111.628000],
                    ["lat" => -7.578000, "lng" => 111.660000],
                    ["lat" => -7.570000, "lng" => 111.695000],
                    ["lat" => -7.562000, "lng" => 111.728000],
                    ["lat" => -7.554000, "lng" => 111.763000],
                    ["lat" => -7.545000, "lng" => 111.798000],
                    ["lat" => -7.537000, "lng" => 111.832000],
                    ["lat" => -7.528000, "lng" => 111.868000],
                    ["lat" => -7.520000, "lng" => 111.903000],
                    ["lat" => -7.510000, "lng" => 111.940000],
                    ["lat" => -7.500000, "lng" => 111.978000],
                    ["lat" => -7.490000, "lng" => 112.015000],
                    ["lat" => -7.480000, "lng" => 112.053000],
                    ["lat" => -7.470000, "lng" => 112.092000],
                    ["lat" => -7.460000, "lng" => 112.130000],
                    ["lat" => -7.450000, "lng" => 112.170000],
                    ["lat" => -7.440000, "lng" => 112.210000],
                    ["lat" => -7.428000, "lng" => 112.252000],
                    ["lat" => -7.416000, "lng" => 112.295000],
                    ["lat" => -7.404000, "lng" => 112.338000],
                    ["lat" => -7.392000, "lng" => 112.382000],
                    ["lat" => -7.380000, "lng" => 112.427000],
                    ["lat" => -7.368000, "lng" => 112.473000],
                    ["lat" => -7.356000, "lng" => 112.520000],
                    ["lat" => -7.345000, "lng" => 112.568000],
                    ["lat" => -7.338000, "lng" => 112.615000],
                    ["lat" => -7.340000, "lng" => 112.660000],
                    ["lat" => -7.348000, "lng" => 112.695000],
                    ["lat" => -7.351402, "lng" => 112.724551],
                ]),
                'jarak' => 140.50,
                'estimasi_waktu' => 180,
                'status' => 'aktif',
                'catatan' => 'Jalur Utama',
            ],
            [
                'nama_rute' => 'Surabaya - Madiun',
                'kota_asal' => 'Surabaya',
                'kota_tujuan' => 'Madiun',
                'polyline' => 'byk~EmxonVDgCBeCBcC@aC?_CB}BByBC{BEyBGwBIwBKuBMsBOqBQoBSmBUkBWiBYiBaBeBiBgBaBeB_BiBYkBWmBUoBSqBQsBOuBMwBKyBIyBG{BE}BC_CAaC?cCBeCDgCFiCHkCJmCLoCNqCPsCRuCTwCVyCXyCZyCb@wCd@uCf@sCh@qCj@oCl@mCn@kCp@iCr@gCt@eCv@cCx@aCz@_C|@}B~@yB`AuBbAqBdAmBfAiBhAeBjA_BlA{AnAuApAqArAmAtAiAvAeAxAaAzA}@|Ay@~Au@`BqAbBmAcBiAeBeBgBaBeB_BiBYiBWkBUmBSoBQqBOsBMuBKwBIyBGyBE{BC}BA_CAaC?aC@cCBeCDgCFiCHkCJmCLoCNqCPsCRuCTwCVyCXyCZyCb@wCd@uCf@sCh@qCj@oCl@mCn@kCp@iCr@gCt@eCv@cCx@aCz@_C|@}B~AyBbAuB',
                'track_coordinates' => json_encode([
                    ["lat" => -7.351402, "lng" => 112.724551],
                    ["lat" => -7.348000, "lng" => 112.695000],
                    ["lat" => -7.340000, "lng" => 112.660000],
                    ["lat" => -7.338000, "lng" => 112.615000],
                    ["lat" => -7.345000, "lng" => 112.568000],
                    ["lat" => -7.356000, "lng" => 112.520000],
                    ["lat" => -7.368000, "lng" => 112.473000],
                    ["lat" => -7.380000, "lng" => 112.427000],
                    ["lat" => -7.392000, "lng" => 112.382000],
                    ["lat" => -7.404000, "lng" => 112.338000],
                    ["lat" => -7.416000, "lng" => 112.295000],
                    ["lat" => -7.428000, "lng" => 112.252000],
                    ["lat" => -7.440000, "lng" => 112.210000],
                    ["lat" => -7.450000, "lng" => 112.170000],
                    ["lat" => -7.460000, "lng" => 112.130000],
                    ["lat" => -7.470000, "lng" => 112.092000],
                    ["lat" => -7.480000, "lng" => 112.053000],
                    ["lat" => -7.490000, "lng" => 112.015000],
                    ["lat" => -7.500000, "lng" => 111.978000],
                    ["lat" => -7.510000, "lng" => 111.940000],
                    ["lat" => -7.520000, "lng" => 111.903000],
                    ["lat" => -7.528000, "lng" => 111.868000],
                    ["lat" => -7.537000, "lng" => 111.832000],
                    ["lat" => -7.545000, "lng" => 111.798000],
                    ["lat" => -7.554000, "lng" => 111.763000],
                    ["lat" => -7.562000, "lng" => 111.728000],
                    ["lat" => -7.570000, "lng" => 111.695000],
                    ["lat" => -7.578000, "lng" => 111.660000],
                    ["lat" => -7.585000, "lng" => 111.628000],
                    ["lat" => -7.592000, "lng" => 111.595000],
                    ["lat" => -7.598000, "lng" => 111.565000],
                    ["lat" => -7.604046, "lng" => 111.534358],
                ]),
                'jarak' => 140.50,
                'estimasi_waktu' => 180,
                'status' => 'aktif',
                'catatan' => 'Jalur Utama',
            ],
        ];

        foreach ($ruteData as $rute) {
            Rute::create($rute);
        }

        $this->command->info('✅ Seeder Rute berhasil! 2 data rute telah ditambahkan.');
    }
}