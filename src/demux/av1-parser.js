import BitReader from './bit-reader';

/**
 * parseAV1CodecConfigurationRecord
 * @param arrayBuffer
 * @param dataOffset
 * @param dataSize
 * @returns {object}
 */
export function parseAV1CodecConfigurationRecord(arrayBuffer, dataOffset, dataSize) {
    const v = new DataView(arrayBuffer, dataOffset, dataSize);
    /**
     class AV1CodecConfigurationRecord {
            // see: https://aomediacodec.github.io/av1-isobmff/#bitstream-overview
         }
     **/
    let oneByte = v.getUint8(0);
    const marker = oneByte >> 7;
    const version = oneByte & 127;

    oneByte = v.getUint8(1);
    const seq_profile = oneByte >> 5;
    const seq_level_idx_0 = oneByte & (0b11111);

    oneByte = v.getUint8(2);
    const seq_tier_0 = oneByte >> 7;
    const high_bitdepth = (oneByte >> 6) & 1;
    const twelve_bit = (oneByte >> 5) & 1;
    const monochrome = (oneByte >> 5) & 1;
    const chroma_subsampling_x = (oneByte >> 3) & 1;
    const chroma_subsampling_y = (oneByte >> 2) & 1;
    const chroma_sample_position = oneByte & 0b11;

    oneByte = v.getUint8(3);
    let reserved = oneByte >> 5;
    const initial_presentation_delay_present = (oneByte >> 4) & 1;
    let initial_presentation_delay_minus_one = undefined;
    if (initial_presentation_delay_present) {
        initial_presentation_delay_minus_one = oneByte & 0b1111;
    } else {
        reserved = oneByte & 0b1111;
    }

    // parse BitDepth for Codecs Parameter String
    // see: https://aomediacodec.github.io/av1-spec/av1-spec.pdf#page=44
    let BitDepth;
    if (seq_profile === 2 && high_bitdepth) {
        BitDepth = twelve_bit ? 12 : 10;
    } else if (seq_profile <= 2) {
        BitDepth = high_bitdepth ? 10 : 8;
    }

    return {
        marker,
        version,
        seq_profile,
        seq_level_idx_0,
        seq_tier_0,
        high_bitdepth,
        twelve_bit,
        monochrome,
        chroma_subsampling_x,
        chroma_subsampling_y,
        chroma_sample_position,
        initial_presentation_delay_minus_one,
        reserved,
        BitDepth,
    };
}

function chooseOperatingPoint() {
    return 0;
}

/**
 * parseSequenceHeaderObu
 * @desc see: https://aomediacodec.github.io/av1-spec/av1-spec.pdf#page=39
 * @param arrayBuffer
 * @param dataOffset
 * @param dataSize
 * @returns {object}
 */
export function parseSequenceHeaderObu(arrayBuffer, dataOffset, dataSize) {
    const bitReader = new BitReader(new Uint8Array(arrayBuffer, dataOffset, dataSize));

    const seq_profile = bitReader.readBits(3);
    const still_picture = bitReader.readBits(1);
    const reduced_still_picture_header = bitReader.readBits(1);

    let timing_info_present_flag;
    let decoder_model_info_present_flag = 0;
    let operating_points_cnt_minus_1;
    const operating_point_idc = [];
    const seq_level_idx = [];
    const seq_tier = [];
    const decoder_model_present_for_this_op = [];
    const initial_display_delay_present_for_this_op = [];
    const initial_display_delay_minus_1 = [];

    if (reduced_still_picture_header) {
        timing_info_present_flag = 0;
        decoder_model_info_present_flag = 0;
        operating_points_cnt_minus_1 = 0;
        operating_point_idc[0] = 0;
        seq_level_idx[0] = bitReader.readBits(5);
        seq_tier[0] = 0;
        decoder_model_present_for_this_op[0] = 0;
        initial_display_delay_present_for_this_op[0] = 0;
    } else {
        timing_info_present_flag = bitReader.readBits(1);

        if (timing_info_present_flag) {
            // timing_info( )
            // todo
        } else {
            decoder_model_info_present_flag = 0;
        }

        const initial_display_delay_present_flag = bitReader.readBits(1);
        operating_points_cnt_minus_1 = bitReader.readBits(5);

        for (let i = 0; i <= operating_points_cnt_minus_1; i++) {
            operating_point_idc[i] = bitReader.readBits(12);
            seq_level_idx[i] = bitReader.readBits(5);

            if (seq_level_idx[i] > 7) {
                seq_tier[i] = bitReader.readBits(1);
            } else {
                seq_tier[i] = 0;
            }

            if (decoder_model_info_present_flag) {
                decoder_model_present_for_this_op[i] = bitReader.readBits(1);

                if (decoder_model_present_for_this_op[i]) {
                    // operating_parameters_info( i )
                    // todo
                }
            } else {
                decoder_model_present_for_this_op[i] = 0;
            }

            if (initial_display_delay_present_flag) {
                initial_display_delay_present_for_this_op[i] = bitReader.readBits(1);

                if (initial_display_delay_present_for_this_op[i]) {
                    initial_display_delay_minus_1[i] = bitReader.readBits(4);
                }
            }
        }
    }

    const frame_width_bits_minus_1 = bitReader.readBits(4);
    const frame_height_bits_minus_1 = bitReader.readBits(4);
    const max_frame_width_minus_1 = bitReader.readBits(frame_width_bits_minus_1 + 1);
    const max_frame_height_minus_1 = bitReader.readBits(frame_height_bits_minus_1 + 1);

    return {
        seq_profile,
        still_picture,
        reduced_still_picture_header,
        timing_info_present_flag,
        decoder_model_info_present_flag,
        operating_points_cnt_minus_1,
        operating_point_idc,
        seq_level_idx,
        seq_tier,
        decoder_model_present_for_this_op,
        initial_display_delay_present_for_this_op,
        initial_display_delay_minus_1,
        max_frame_width_minus_1,
        max_frame_height_minus_1,
    };
}
