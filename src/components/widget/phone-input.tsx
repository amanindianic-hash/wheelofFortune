'use client';

import { useState } from 'react';

// All 195 UN-recognised countries + territories with dial codes and mobile number length rules
const COUNTRIES = [
  { code: 'AF', dial: '+93',   flag: '🇦🇫', name: 'Afghanistan',                    minLen: 9,  maxLen: 9  },
  { code: 'AL', dial: '+355',  flag: '🇦🇱', name: 'Albania',                        minLen: 9,  maxLen: 9  },
  { code: 'DZ', dial: '+213',  flag: '🇩🇿', name: 'Algeria',                        minLen: 9,  maxLen: 9  },
  { code: 'AD', dial: '+376',  flag: '🇦🇩', name: 'Andorra',                        minLen: 6,  maxLen: 9  },
  { code: 'AO', dial: '+244',  flag: '🇦🇴', name: 'Angola',                         minLen: 9,  maxLen: 9  },
  { code: 'AG', dial: '+1268', flag: '🇦🇬', name: 'Antigua and Barbuda',            minLen: 10, maxLen: 10 },
  { code: 'AR', dial: '+54',   flag: '🇦🇷', name: 'Argentina',                      minLen: 10, maxLen: 11 },
  { code: 'AM', dial: '+374',  flag: '🇦🇲', name: 'Armenia',                        minLen: 8,  maxLen: 8  },
  { code: 'AU', dial: '+61',   flag: '🇦🇺', name: 'Australia',                      minLen: 9,  maxLen: 9  },
  { code: 'AT', dial: '+43',   flag: '🇦🇹', name: 'Austria',                        minLen: 10, maxLen: 11 },
  { code: 'AZ', dial: '+994',  flag: '🇦🇿', name: 'Azerbaijan',                     minLen: 9,  maxLen: 9  },
  { code: 'BS', dial: '+1242', flag: '🇧🇸', name: 'Bahamas',                        minLen: 10, maxLen: 10 },
  { code: 'BH', dial: '+973',  flag: '🇧🇭', name: 'Bahrain',                        minLen: 8,  maxLen: 8  },
  { code: 'BD', dial: '+880',  flag: '🇧🇩', name: 'Bangladesh',                     minLen: 10, maxLen: 10 },
  { code: 'BB', dial: '+1246', flag: '🇧🇧', name: 'Barbados',                       minLen: 10, maxLen: 10 },
  { code: 'BY', dial: '+375',  flag: '🇧🇾', name: 'Belarus',                        minLen: 9,  maxLen: 9  },
  { code: 'BE', dial: '+32',   flag: '🇧🇪', name: 'Belgium',                        minLen: 9,  maxLen: 9  },
  { code: 'BZ', dial: '+501',  flag: '🇧🇿', name: 'Belize',                         minLen: 7,  maxLen: 7  },
  { code: 'BJ', dial: '+229',  flag: '🇧🇯', name: 'Benin',                          minLen: 8,  maxLen: 8  },
  { code: 'BT', dial: '+975',  flag: '🇧🇹', name: 'Bhutan',                         minLen: 8,  maxLen: 8  },
  { code: 'BO', dial: '+591',  flag: '🇧🇴', name: 'Bolivia',                        minLen: 8,  maxLen: 8  },
  { code: 'BA', dial: '+387',  flag: '🇧🇦', name: 'Bosnia and Herzegovina',         minLen: 8,  maxLen: 8  },
  { code: 'BW', dial: '+267',  flag: '🇧🇼', name: 'Botswana',                       minLen: 7,  maxLen: 8  },
  { code: 'BR', dial: '+55',   flag: '🇧🇷', name: 'Brazil',                         minLen: 10, maxLen: 11 },
  { code: 'BN', dial: '+673',  flag: '🇧🇳', name: 'Brunei',                         minLen: 7,  maxLen: 7  },
  { code: 'BG', dial: '+359',  flag: '🇧🇬', name: 'Bulgaria',                       minLen: 9,  maxLen: 9  },
  { code: 'BF', dial: '+226',  flag: '🇧🇫', name: 'Burkina Faso',                   minLen: 8,  maxLen: 8  },
  { code: 'BI', dial: '+257',  flag: '🇧🇮', name: 'Burundi',                        minLen: 8,  maxLen: 8  },
  { code: 'CV', dial: '+238',  flag: '🇨🇻', name: 'Cabo Verde',                     minLen: 7,  maxLen: 7  },
  { code: 'KH', dial: '+855',  flag: '🇰🇭', name: 'Cambodia',                       minLen: 9,  maxLen: 9  },
  { code: 'CM', dial: '+237',  flag: '🇨🇲', name: 'Cameroon',                       minLen: 9,  maxLen: 9  },
  { code: 'CA', dial: '+1',    flag: '🇨🇦', name: 'Canada',                         minLen: 10, maxLen: 10 },
  { code: 'CF', dial: '+236',  flag: '🇨🇫', name: 'Central African Republic',       minLen: 8,  maxLen: 8  },
  { code: 'TD', dial: '+235',  flag: '🇹🇩', name: 'Chad',                           minLen: 8,  maxLen: 8  },
  { code: 'CL', dial: '+56',   flag: '🇨🇱', name: 'Chile',                          minLen: 9,  maxLen: 9  },
  { code: 'CN', dial: '+86',   flag: '🇨🇳', name: 'China',                          minLen: 11, maxLen: 11 },
  { code: 'CO', dial: '+57',   flag: '🇨🇴', name: 'Colombia',                       minLen: 10, maxLen: 10 },
  { code: 'KM', dial: '+269',  flag: '🇰🇲', name: 'Comoros',                        minLen: 7,  maxLen: 7  },
  { code: 'CG', dial: '+242',  flag: '🇨🇬', name: 'Congo',                          minLen: 9,  maxLen: 9  },
  { code: 'CD', dial: '+243',  flag: '🇨🇩', name: 'Congo (DRC)',                    minLen: 9,  maxLen: 9  },
  { code: 'CR', dial: '+506',  flag: '🇨🇷', name: 'Costa Rica',                     minLen: 8,  maxLen: 8  },
  { code: 'HR', dial: '+385',  flag: '🇭🇷', name: 'Croatia',                        minLen: 9,  maxLen: 9  },
  { code: 'CU', dial: '+53',   flag: '🇨🇺', name: 'Cuba',                           minLen: 8,  maxLen: 8  },
  { code: 'CY', dial: '+357',  flag: '🇨🇾', name: 'Cyprus',                         minLen: 8,  maxLen: 8  },
  { code: 'CZ', dial: '+420',  flag: '🇨🇿', name: 'Czech Republic',                 minLen: 9,  maxLen: 9  },
  { code: 'DK', dial: '+45',   flag: '🇩🇰', name: 'Denmark',                        minLen: 8,  maxLen: 8  },
  { code: 'DJ', dial: '+253',  flag: '🇩🇯', name: 'Djibouti',                       minLen: 8,  maxLen: 8  },
  { code: 'DM', dial: '+1767', flag: '🇩🇲', name: 'Dominica',                       minLen: 10, maxLen: 10 },
  { code: 'DO', dial: '+1809', flag: '🇩🇴', name: 'Dominican Republic',             minLen: 10, maxLen: 10 },
  { code: 'EC', dial: '+593',  flag: '🇪🇨', name: 'Ecuador',                        minLen: 9,  maxLen: 9  },
  { code: 'EG', dial: '+20',   flag: '🇪🇬', name: 'Egypt',                          minLen: 10, maxLen: 10 },
  { code: 'SV', dial: '+503',  flag: '🇸🇻', name: 'El Salvador',                    minLen: 8,  maxLen: 8  },
  { code: 'GQ', dial: '+240',  flag: '🇬🇶', name: 'Equatorial Guinea',              minLen: 9,  maxLen: 9  },
  { code: 'ER', dial: '+291',  flag: '🇪🇷', name: 'Eritrea',                        minLen: 7,  maxLen: 7  },
  { code: 'EE', dial: '+372',  flag: '🇪🇪', name: 'Estonia',                        minLen: 7,  maxLen: 8  },
  { code: 'SZ', dial: '+268',  flag: '🇸🇿', name: 'Eswatini',                       minLen: 8,  maxLen: 8  },
  { code: 'ET', dial: '+251',  flag: '🇪🇹', name: 'Ethiopia',                       minLen: 9,  maxLen: 9  },
  { code: 'FJ', dial: '+679',  flag: '🇫🇯', name: 'Fiji',                           minLen: 7,  maxLen: 7  },
  { code: 'FI', dial: '+358',  flag: '🇫🇮', name: 'Finland',                        minLen: 9,  maxLen: 10 },
  { code: 'FR', dial: '+33',   flag: '🇫🇷', name: 'France',                         minLen: 9,  maxLen: 9  },
  { code: 'GA', dial: '+241',  flag: '🇬🇦', name: 'Gabon',                          minLen: 8,  maxLen: 8  },
  { code: 'GM', dial: '+220',  flag: '🇬🇲', name: 'Gambia',                         minLen: 7,  maxLen: 7  },
  { code: 'GE', dial: '+995',  flag: '🇬🇪', name: 'Georgia',                        minLen: 9,  maxLen: 9  },
  { code: 'DE', dial: '+49',   flag: '🇩🇪', name: 'Germany',                        minLen: 10, maxLen: 11 },
  { code: 'GH', dial: '+233',  flag: '🇬🇭', name: 'Ghana',                          minLen: 9,  maxLen: 9  },
  { code: 'GR', dial: '+30',   flag: '🇬🇷', name: 'Greece',                         minLen: 10, maxLen: 10 },
  { code: 'GD', dial: '+1473', flag: '🇬🇩', name: 'Grenada',                        minLen: 10, maxLen: 10 },
  { code: 'GT', dial: '+502',  flag: '🇬🇹', name: 'Guatemala',                      minLen: 8,  maxLen: 8  },
  { code: 'GN', dial: '+224',  flag: '🇬🇳', name: 'Guinea',                         minLen: 9,  maxLen: 9  },
  { code: 'GW', dial: '+245',  flag: '🇬🇼', name: 'Guinea-Bissau',                  minLen: 7,  maxLen: 7  },
  { code: 'GY', dial: '+592',  flag: '🇬🇾', name: 'Guyana',                         minLen: 7,  maxLen: 7  },
  { code: 'HT', dial: '+509',  flag: '🇭🇹', name: 'Haiti',                          minLen: 8,  maxLen: 8  },
  { code: 'HN', dial: '+504',  flag: '🇭🇳', name: 'Honduras',                       minLen: 8,  maxLen: 8  },
  { code: 'HU', dial: '+36',   flag: '🇭🇺', name: 'Hungary',                        minLen: 9,  maxLen: 9  },
  { code: 'IS', dial: '+354',  flag: '🇮🇸', name: 'Iceland',                        minLen: 7,  maxLen: 7  },
  { code: 'IN', dial: '+91',   flag: '🇮🇳', name: 'India',                          minLen: 10, maxLen: 10 },
  { code: 'ID', dial: '+62',   flag: '🇮🇩', name: 'Indonesia',                      minLen: 9,  maxLen: 12 },
  { code: 'IR', dial: '+98',   flag: '🇮🇷', name: 'Iran',                           minLen: 10, maxLen: 10 },
  { code: 'IQ', dial: '+964',  flag: '🇮🇶', name: 'Iraq',                           minLen: 10, maxLen: 10 },
  { code: 'IE', dial: '+353',  flag: '🇮🇪', name: 'Ireland',                        minLen: 9,  maxLen: 9  },
  { code: 'IL', dial: '+972',  flag: '🇮🇱', name: 'Israel',                         minLen: 9,  maxLen: 9  },
  { code: 'IT', dial: '+39',   flag: '🇮🇹', name: 'Italy',                          minLen: 9,  maxLen: 10 },
  { code: 'JM', dial: '+1876', flag: '🇯🇲', name: 'Jamaica',                        minLen: 10, maxLen: 10 },
  { code: 'JP', dial: '+81',   flag: '🇯🇵', name: 'Japan',                          minLen: 10, maxLen: 11 },
  { code: 'JO', dial: '+962',  flag: '🇯🇴', name: 'Jordan',                         minLen: 9,  maxLen: 9  },
  { code: 'KZ', dial: '+7',    flag: '🇰🇿', name: 'Kazakhstan',                     minLen: 10, maxLen: 10 },
  { code: 'KE', dial: '+254',  flag: '🇰🇪', name: 'Kenya',                          minLen: 9,  maxLen: 9  },
  { code: 'KI', dial: '+686',  flag: '🇰🇮', name: 'Kiribati',                       minLen: 8,  maxLen: 8  },
  { code: 'KW', dial: '+965',  flag: '🇰🇼', name: 'Kuwait',                         minLen: 8,  maxLen: 8  },
  { code: 'KG', dial: '+996',  flag: '🇰🇬', name: 'Kyrgyzstan',                     minLen: 9,  maxLen: 9  },
  { code: 'LA', dial: '+856',  flag: '🇱🇦', name: 'Laos',                           minLen: 8,  maxLen: 9  },
  { code: 'LV', dial: '+371',  flag: '🇱🇻', name: 'Latvia',                         minLen: 8,  maxLen: 8  },
  { code: 'LB', dial: '+961',  flag: '🇱🇧', name: 'Lebanon',                        minLen: 7,  maxLen: 8  },
  { code: 'LS', dial: '+266',  flag: '🇱🇸', name: 'Lesotho',                        minLen: 8,  maxLen: 8  },
  { code: 'LR', dial: '+231',  flag: '🇱🇷', name: 'Liberia',                        minLen: 8,  maxLen: 8  },
  { code: 'LY', dial: '+218',  flag: '🇱🇾', name: 'Libya',                          minLen: 9,  maxLen: 9  },
  { code: 'LI', dial: '+423',  flag: '🇱🇮', name: 'Liechtenstein',                  minLen: 7,  maxLen: 9  },
  { code: 'LT', dial: '+370',  flag: '🇱🇹', name: 'Lithuania',                      minLen: 8,  maxLen: 8  },
  { code: 'LU', dial: '+352',  flag: '🇱🇺', name: 'Luxembourg',                     minLen: 9,  maxLen: 9  },
  { code: 'MG', dial: '+261',  flag: '🇲🇬', name: 'Madagascar',                     minLen: 9,  maxLen: 9  },
  { code: 'MW', dial: '+265',  flag: '🇲🇼', name: 'Malawi',                         minLen: 9,  maxLen: 9  },
  { code: 'MY', dial: '+60',   flag: '🇲🇾', name: 'Malaysia',                       minLen: 9,  maxLen: 10 },
  { code: 'MV', dial: '+960',  flag: '🇲🇻', name: 'Maldives',                       minLen: 7,  maxLen: 7  },
  { code: 'ML', dial: '+223',  flag: '🇲🇱', name: 'Mali',                           minLen: 8,  maxLen: 8  },
  { code: 'MT', dial: '+356',  flag: '🇲🇹', name: 'Malta',                          minLen: 8,  maxLen: 8  },
  { code: 'MH', dial: '+692',  flag: '🇲🇭', name: 'Marshall Islands',               minLen: 7,  maxLen: 7  },
  { code: 'MR', dial: '+222',  flag: '🇲🇷', name: 'Mauritania',                     minLen: 8,  maxLen: 8  },
  { code: 'MU', dial: '+230',  flag: '🇲🇺', name: 'Mauritius',                      minLen: 8,  maxLen: 8  },
  { code: 'MX', dial: '+52',   flag: '🇲🇽', name: 'Mexico',                         minLen: 10, maxLen: 10 },
  { code: 'FM', dial: '+691',  flag: '🇫🇲', name: 'Micronesia',                     minLen: 7,  maxLen: 7  },
  { code: 'MD', dial: '+373',  flag: '🇲🇩', name: 'Moldova',                        minLen: 8,  maxLen: 8  },
  { code: 'MC', dial: '+377',  flag: '🇲🇨', name: 'Monaco',                         minLen: 8,  maxLen: 9  },
  { code: 'MN', dial: '+976',  flag: '🇲🇳', name: 'Mongolia',                       minLen: 8,  maxLen: 8  },
  { code: 'ME', dial: '+382',  flag: '🇲🇪', name: 'Montenegro',                     minLen: 8,  maxLen: 8  },
  { code: 'MA', dial: '+212',  flag: '🇲🇦', name: 'Morocco',                        minLen: 9,  maxLen: 9  },
  { code: 'MZ', dial: '+258',  flag: '🇲🇿', name: 'Mozambique',                     minLen: 9,  maxLen: 9  },
  { code: 'MM', dial: '+95',   flag: '🇲🇲', name: 'Myanmar',                        minLen: 9,  maxLen: 10 },
  { code: 'NA', dial: '+264',  flag: '🇳🇦', name: 'Namibia',                        minLen: 9,  maxLen: 9  },
  { code: 'NR', dial: '+674',  flag: '🇳🇷', name: 'Nauru',                          minLen: 7,  maxLen: 7  },
  { code: 'NP', dial: '+977',  flag: '🇳🇵', name: 'Nepal',                          minLen: 10, maxLen: 10 },
  { code: 'NL', dial: '+31',   flag: '🇳🇱', name: 'Netherlands',                    minLen: 9,  maxLen: 9  },
  { code: 'NZ', dial: '+64',   flag: '🇳🇿', name: 'New Zealand',                    minLen: 8,  maxLen: 9  },
  { code: 'NI', dial: '+505',  flag: '🇳🇮', name: 'Nicaragua',                      minLen: 8,  maxLen: 8  },
  { code: 'NE', dial: '+227',  flag: '🇳🇪', name: 'Niger',                          minLen: 8,  maxLen: 8  },
  { code: 'NG', dial: '+234',  flag: '🇳🇬', name: 'Nigeria',                        minLen: 10, maxLen: 10 },
  { code: 'NO', dial: '+47',   flag: '🇳🇴', name: 'Norway',                         minLen: 8,  maxLen: 8  },
  { code: 'OM', dial: '+968',  flag: '🇴🇲', name: 'Oman',                           minLen: 8,  maxLen: 8  },
  { code: 'PK', dial: '+92',   flag: '🇵🇰', name: 'Pakistan',                       minLen: 10, maxLen: 10 },
  { code: 'PW', dial: '+680',  flag: '🇵🇼', name: 'Palau',                          minLen: 7,  maxLen: 7  },
  { code: 'PA', dial: '+507',  flag: '🇵🇦', name: 'Panama',                         minLen: 8,  maxLen: 8  },
  { code: 'PG', dial: '+675',  flag: '🇵🇬', name: 'Papua New Guinea',               minLen: 8,  maxLen: 8  },
  { code: 'PY', dial: '+595',  flag: '🇵🇾', name: 'Paraguay',                       minLen: 9,  maxLen: 9  },
  { code: 'PE', dial: '+51',   flag: '🇵🇪', name: 'Peru',                           minLen: 9,  maxLen: 9  },
  { code: 'PH', dial: '+63',   flag: '🇵🇭', name: 'Philippines',                    minLen: 10, maxLen: 10 },
  { code: 'PL', dial: '+48',   flag: '🇵🇱', name: 'Poland',                         minLen: 9,  maxLen: 9  },
  { code: 'PT', dial: '+351',  flag: '🇵🇹', name: 'Portugal',                       minLen: 9,  maxLen: 9  },
  { code: 'QA', dial: '+974',  flag: '🇶🇦', name: 'Qatar',                          minLen: 8,  maxLen: 8  },
  { code: 'RO', dial: '+40',   flag: '🇷🇴', name: 'Romania',                        minLen: 9,  maxLen: 9  },
  { code: 'RU', dial: '+7',    flag: '🇷🇺', name: 'Russia',                         minLen: 10, maxLen: 10 },
  { code: 'RW', dial: '+250',  flag: '🇷🇼', name: 'Rwanda',                         minLen: 9,  maxLen: 9  },
  { code: 'KN', dial: '+1869', flag: '🇰🇳', name: 'Saint Kitts and Nevis',          minLen: 10, maxLen: 10 },
  { code: 'LC', dial: '+1758', flag: '🇱🇨', name: 'Saint Lucia',                    minLen: 10, maxLen: 10 },
  { code: 'VC', dial: '+1784', flag: '🇻🇨', name: 'Saint Vincent and Grenadines',   minLen: 10, maxLen: 10 },
  { code: 'WS', dial: '+685',  flag: '🇼🇸', name: 'Samoa',                          minLen: 7,  maxLen: 7  },
  { code: 'SM', dial: '+378',  flag: '🇸🇲', name: 'San Marino',                     minLen: 8,  maxLen: 10 },
  { code: 'ST', dial: '+239',  flag: '🇸🇹', name: 'Sao Tome and Principe',          minLen: 7,  maxLen: 7  },
  { code: 'SA', dial: '+966',  flag: '🇸🇦', name: 'Saudi Arabia',                   minLen: 9,  maxLen: 9  },
  { code: 'SN', dial: '+221',  flag: '🇸🇳', name: 'Senegal',                        minLen: 9,  maxLen: 9  },
  { code: 'RS', dial: '+381',  flag: '🇷🇸', name: 'Serbia',                         minLen: 9,  maxLen: 9  },
  { code: 'SC', dial: '+248',  flag: '🇸🇨', name: 'Seychelles',                     minLen: 7,  maxLen: 7  },
  { code: 'SL', dial: '+232',  flag: '🇸🇱', name: 'Sierra Leone',                   minLen: 8,  maxLen: 8  },
  { code: 'SG', dial: '+65',   flag: '🇸🇬', name: 'Singapore',                      minLen: 8,  maxLen: 8  },
  { code: 'SK', dial: '+421',  flag: '🇸🇰', name: 'Slovakia',                       minLen: 9,  maxLen: 9  },
  { code: 'SI', dial: '+386',  flag: '🇸🇮', name: 'Slovenia',                       minLen: 8,  maxLen: 8  },
  { code: 'SB', dial: '+677',  flag: '🇸🇧', name: 'Solomon Islands',                minLen: 7,  maxLen: 7  },
  { code: 'SO', dial: '+252',  flag: '🇸🇴', name: 'Somalia',                        minLen: 8,  maxLen: 9  },
  { code: 'ZA', dial: '+27',   flag: '🇿🇦', name: 'South Africa',                   minLen: 9,  maxLen: 9  },
  { code: 'SS', dial: '+211',  flag: '🇸🇸', name: 'South Sudan',                    minLen: 9,  maxLen: 9  },
  { code: 'ES', dial: '+34',   flag: '🇪🇸', name: 'Spain',                          minLen: 9,  maxLen: 9  },
  { code: 'LK', dial: '+94',   flag: '🇱🇰', name: 'Sri Lanka',                      minLen: 9,  maxLen: 9  },
  { code: 'SD', dial: '+249',  flag: '🇸🇩', name: 'Sudan',                          minLen: 9,  maxLen: 9  },
  { code: 'SR', dial: '+597',  flag: '🇸🇷', name: 'Suriname',                       minLen: 7,  maxLen: 7  },
  { code: 'SE', dial: '+46',   flag: '🇸🇪', name: 'Sweden',                         minLen: 9,  maxLen: 9  },
  { code: 'CH', dial: '+41',   flag: '🇨🇭', name: 'Switzerland',                    minLen: 9,  maxLen: 9  },
  { code: 'SY', dial: '+963',  flag: '🇸🇾', name: 'Syria',                          minLen: 9,  maxLen: 9  },
  { code: 'TW', dial: '+886',  flag: '🇹🇼', name: 'Taiwan',                         minLen: 9,  maxLen: 9  },
  { code: 'TJ', dial: '+992',  flag: '🇹🇯', name: 'Tajikistan',                     minLen: 9,  maxLen: 9  },
  { code: 'TZ', dial: '+255',  flag: '🇹🇿', name: 'Tanzania',                       minLen: 9,  maxLen: 9  },
  { code: 'TH', dial: '+66',   flag: '🇹🇭', name: 'Thailand',                       minLen: 9,  maxLen: 9  },
  { code: 'TL', dial: '+670',  flag: '🇹🇱', name: 'Timor-Leste',                    minLen: 7,  maxLen: 8  },
  { code: 'TG', dial: '+228',  flag: '🇹🇬', name: 'Togo',                           minLen: 8,  maxLen: 8  },
  { code: 'TO', dial: '+676',  flag: '🇹🇴', name: 'Tonga',                          minLen: 7,  maxLen: 7  },
  { code: 'TT', dial: '+1868', flag: '🇹🇹', name: 'Trinidad and Tobago',            minLen: 10, maxLen: 10 },
  { code: 'TN', dial: '+216',  flag: '🇹🇳', name: 'Tunisia',                        minLen: 8,  maxLen: 8  },
  { code: 'TR', dial: '+90',   flag: '🇹🇷', name: 'Turkey',                         minLen: 10, maxLen: 10 },
  { code: 'TM', dial: '+993',  flag: '🇹🇲', name: 'Turkmenistan',                   minLen: 8,  maxLen: 8  },
  { code: 'TV', dial: '+688',  flag: '🇹🇻', name: 'Tuvalu',                         minLen: 6,  maxLen: 7  },
  { code: 'UG', dial: '+256',  flag: '🇺🇬', name: 'Uganda',                         minLen: 9,  maxLen: 9  },
  { code: 'UA', dial: '+380',  flag: '🇺🇦', name: 'Ukraine',                        minLen: 9,  maxLen: 9  },
  { code: 'AE', dial: '+971',  flag: '🇦🇪', name: 'United Arab Emirates',           minLen: 9,  maxLen: 9  },
  { code: 'GB', dial: '+44',   flag: '🇬🇧', name: 'United Kingdom',                 minLen: 10, maxLen: 10 },
  { code: 'US', dial: '+1',    flag: '🇺🇸', name: 'United States',                  minLen: 10, maxLen: 10 },
  { code: 'UY', dial: '+598',  flag: '🇺🇾', name: 'Uruguay',                        minLen: 9,  maxLen: 9  },
  { code: 'UZ', dial: '+998',  flag: '🇺🇿', name: 'Uzbekistan',                     minLen: 9,  maxLen: 9  },
  { code: 'VU', dial: '+678',  flag: '🇻🇺', name: 'Vanuatu',                        minLen: 7,  maxLen: 7  },
  { code: 'VE', dial: '+58',   flag: '🇻🇪', name: 'Venezuela',                      minLen: 10, maxLen: 10 },
  { code: 'VN', dial: '+84',   flag: '🇻🇳', name: 'Vietnam',                        minLen: 9,  maxLen: 10 },
  { code: 'YE', dial: '+967',  flag: '🇾🇪', name: 'Yemen',                          minLen: 9,  maxLen: 9  },
  { code: 'ZM', dial: '+260',  flag: '🇿🇲', name: 'Zambia',                         minLen: 9,  maxLen: 9  },
  { code: 'ZW', dial: '+263',  flag: '🇿🇼', name: 'Zimbabwe',                       minLen: 9,  maxLen: 9  },
];

export function validatePhone(dial: string, local: string): string | null {
  const digits = local.replace(/\D/g, '');
  const country = COUNTRIES.find(c => c.dial === dial);
  if (!country) return null;
  if (digits.length < country.minLen) return `Enter at least ${country.minLen} digits`;
  if (digits.length > country.maxLen) return `Maximum ${country.maxLen} digits allowed`;
  return null;
}

interface PhoneInputProps {
  value: string;
  onChange: (full: string) => void;
  required?: boolean;
  id?: string;
}

export function PhoneInput({ value, onChange, required, id }: PhoneInputProps) {
  const parsed  = value.match(/^(\+\d+)\s(.*)$/) ?? null;
  const [dial, setDial]     = useState(parsed?.[1] ?? '+91');
  const [local, setLocal]   = useState(parsed?.[2] ?? '');
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');

  const selected = COUNTRIES.find(c => c.dial === dial) ?? COUNTRIES.find(c => c.code === 'IN')!;
  const error    = local ? validatePhone(dial, local) : null;

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  function pickCountry(c: (typeof COUNTRIES)[0]) {
    setDial(c.dial);
    setOpen(false);
    setSearch('');
    onChange(local ? `${c.dial} ${local.replace(/\D/g, '')}` : '');
  }

  function handleLocal(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    setLocal(digits);
    onChange(digits ? `${dial} ${digits}` : '');
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {/* Country picker button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 h-10 px-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-xs text-gray-600">{dial}</span>
            <svg className="w-3 h-3 opacity-50 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute top-11 left-0 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-gray-100 bg-gray-50">
                  <input
                    autoFocus
                    placeholder="Search country or code…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <ul className="max-h-56 overflow-y-auto overscroll-contain">
                  {filtered.length === 0 && (
                    <li className="px-4 py-3 text-sm text-gray-400">No results</li>
                  )}
                  {filtered.map(c => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => pickCountry(c)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left hover:bg-gray-50 ${c.dial === dial && c.code === selected.code ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-800'}`}
                      >
                        <span className="text-base w-6 text-center">{c.flag}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{c.dial}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Number input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder={`${selected.minLen}–${selected.maxLen} digit number`}
          value={local}
          onChange={handleLocal}
          required={required}
          className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
