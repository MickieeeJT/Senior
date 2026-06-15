-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 01, 2026 at 09:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `investgame`
--

-- --------------------------------------------------------

--
-- Table structure for table `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `achievements`
--

INSERT INTO `achievements` (`id`, `code`, `name`, `description`) VALUES
(1, '5_STAR', '5-Star General', 'Achieve a perfect 5-star rating in a single game.'),
(2, 'WHALE', 'The Whale', 'Finish with a Net Worth over $1,000,000.'),
(3, 'BOT_CRUSHER', 'Bot Crusher', 'Beat the Bot portfolio value by at least 20%.'),
(4, 'INFLATION_BUSTER', 'Inflation Buster', 'Achieve a Total Return of > 200%.'),
(5, 'TURTLE', 'The Turtle', 'Finish with a Profit while having $0 invested in Stocks/Crypto.'),
(6, 'YOLO', 'YOLO Trader', 'Finish with a Profit while having > 90% assets in Stocks/Crypto.'),
(7, 'IRON_HANDS', 'Iron Hands', 'Finish profitable despite suffering a -40% Max Drawdown.'),
(8, 'HOARDER', 'The Hoarder', 'End the game with > $100,000 in Savings.'),
(9, 'GOLDFINGER', 'Goldfinger', 'Gold profit is higher than Stocks & Bonds combined.'),
(10, 'COUPON_CLIPPER', 'Coupon Clipper', 'Earn > $20,000 profit purely from Bonds.'),
(11, 'REKT', 'Rekt', 'Finish with less money than you invested.'),
(12, 'LOST_DECADE', 'Lost Decade', 'Your final value was lower than the Bot.');

-- --------------------------------------------------------

--
-- Table structure for table `active_sessions`
--

CREATE TABLE `active_sessions` (
  `user_id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `game_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`game_state`)),
  `bot_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bot_state`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `active_sessions`
--

INSERT INTO `active_sessions` (`user_id`, `session_id`, `game_state`, `bot_state`, `updated_at`) VALUES
(2, '1771166376531', '{\"userId\":2,\"sessionId\":\"1771166376531\",\"pocket\":7016.92,\"totalInvested\":96000,\"portfolioHistory\":[4000,12753.05,20594.43,29515.762000000002,43060.03800000001,49028.488000000005,78572.484,120660.448,132835.8,197037.02199999997,137534.13,161584.062],\"savingsBalance\":21018.24,\"currentYear\":12,\"currentMonth\":8,\"fundBalance\":2299.96,\"goldBalance\":1726.35,\"indexShares\":1.8729120591700268,\"goldShares\":1.9061415881971713,\"indexAvgPrice\":1029.76,\"goldAvgPrice\":524.62,\"profit\":{\"savings\":12018.25,\"bonds\":89.85,\"index\":28.65,\"gold\":0,\"stocks\":{\"AOT\":1427.35},\"currencies\":{}},\"holdings\":{\"bonds\":1000,\"index\":1928.65,\"gold\":1000,\"stocks\":{\"CPALL\":{\"shares\":1294,\"avgCost\":3.1192272024729517},\"EGCO\":{\"shares\":153,\"avgCost\":76.6470588235294},\"DELTA\":{\"shares\":1854,\"avgCost\":11.89072276159655},\"AOT\":{\"shares\":1109,\"avgCost\":23.425698827772766}},\"currencies\":{\"USD\":{\"units\":80,\"avgCost\":38.39475},\"JPY\":{\"units\":344,\"avgCost\":30.98200581395349}}},\"bondInvestments\":[{\"id\":1771169575301,\"duration\":5,\"amount\":1043.11,\"remaining\":3.6666666666666696,\"bondType\":\"5 years\",\"originalAmount\":1000}],\"bondInterestRates\":{\"1 year\":0.019476255076506886,\"5 years\":0.03088333866446153,\"10 years\":0.039795966872054125},\"lastProcessedMonth\":8,\"currentProgress\":0}', NULL, '2026-02-15 15:49:03'),
(7, '1777546732959', '{\"userId\":7,\"sessionId\":\"1777546732959\",\"maxYears\":40,\"targetAmount\":70000000,\"pocket\":8000,\"totalInvested\":8000,\"portfolioHistory\":[4000],\"savingsBalance\":0,\"currentYear\":1,\"currentMonth\":7,\"fundBalance\":0,\"goldBalance\":0,\"indexShares\":0,\"goldShares\":0,\"indexAvgPrice\":0,\"goldAvgPrice\":0,\"profit\":{\"savings\":0,\"bonds\":0,\"index\":0,\"gold\":0,\"stocks\":{},\"currencies\":{}},\"holdings\":{\"bonds\":0,\"index\":0,\"gold\":0,\"stocks\":{},\"currencies\":{}},\"bondInvestments\":[],\"bondInterestRates\":{\"1 year\":0.042374679617486324,\"5 years\":0.06505135742170662,\"10 years\":0.07912826941921847},\"lastProcessedMonth\":7}', '{\"pocket\":0,\"savingsBalance\":804,\"bondBalance\":1216.14,\"fundBalance\":1273.61,\"goldBalance\":432.93,\"indexShares\":0.6473389744301106,\"goldShares\":121.95121951219512,\"stockShares\":{\"Quantum Tech\":2.5236593059936907,\"Apex Dynamics\":4.4953922229714545,\"Stellar Logistics\":1.582654110944053,\"Nova Healthcare\":3.2425421530479897},\"currencyUnits\":{\"Neo-Dollar (ND)\":3.2986970146792016,\"Euro-Coin (EC)\":3.6944675348665372,\"Yen-Prime (YP)\":6.027727546714889},\"totalNetWorth\":4922.48}', '2026-04-30 11:08:34');

-- --------------------------------------------------------

--
-- Table structure for table `score_history`
--

CREATE TABLE `score_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  `played_at` datetime DEFAULT current_timestamp(),
  `star` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `score_history`
--

INSERT INTO `score_history` (`id`, `user_id`, `score`, `played_at`, `star`) VALUES
(31, 2, 124000, '2025-12-03 16:09:42', 1),
(32, 2, 141700, '2025-12-03 16:14:42', 1),
(33, 2, 127960, '2025-12-03 16:17:20', 1),
(34, 2, 1623026, '2025-12-03 16:24:39', 4),
(35, 2, 132000, '2025-12-03 16:26:50', 1),
(36, 2, 101366, '2025-12-06 20:25:52', 1),
(37, 2, 1389370, '2025-12-06 21:17:11', 3),
(38, 9, 167500, '2026-04-09 15:55:05', 1),
(39, 9, 148500, '2026-04-09 16:04:43', 1),
(40, 9, 154500, '2026-04-09 16:11:06', 1),
(41, 9, 172000, '2026-04-09 16:16:44', 1),
(42, 9, 452321, '2026-04-09 16:32:47', 5),
(43, 9, 153500, '2026-04-09 16:37:27', 1),
(44, 9, 157000, '2026-04-09 17:11:16', 0),
(45, 9, 164000, '2026-04-09 17:32:36', 0),
(46, 9, 418498, '2026-04-09 20:54:20', 5),
(47, 9, 146000, '2026-04-09 20:56:31', 1),
(48, 9, 163000, '2026-04-09 21:01:47', 1),
(49, 9, 172000, '2026-04-09 21:17:45', 1),
(50, 9, 162000, '2026-04-09 21:20:53', 1),
(51, 9, 169500, '2026-04-10 09:11:13', 1),
(52, 9, 156500, '2026-04-10 09:52:40', 1),
(53, 9, 161500, '2026-04-10 10:01:35', 1),
(54, 7, 155500, '2026-04-10 10:16:09', 1),
(55, 7, 168500, '2026-04-10 11:36:30', 1),
(56, 7, 163500, '2026-04-10 13:39:23', 1),
(57, 7, 924958, '2026-04-10 14:01:06', 5),
(58, 9, 503094, '2026-04-10 14:13:29', 5),
(59, 7, 201539, '2026-04-10 14:37:57', 3),
(60, 7, 657037, '2026-04-10 14:39:49', 5),
(61, 7, 978823, '2026-04-10 14:50:51', 4),
(62, 7, 166000, '2026-04-10 15:17:39', 1),
(63, 7, 159500, '2026-04-10 15:29:08', 1),
(64, 7, 158000, '2026-04-10 15:31:40', 1),
(65, 7, 158000, '2026-04-10 15:43:52', 1),
(66, 7, 166500, '2026-04-10 15:45:44', 1),
(67, 7, 156000, '2026-04-10 16:40:19', 1),
(68, 7, 156000, '2026-04-10 16:47:07', 1),
(69, 7, 164000, '2026-04-10 16:49:55', 1),
(70, 7, 558582, '2026-04-10 17:24:18', 5),
(71, 7, 158500, '2026-04-10 18:26:19', 1),
(72, 9, 137000, '2026-04-10 18:31:09', 1),
(73, 9, 156000, '2026-04-10 18:40:20', 1),
(74, 9, 151500, '2026-04-10 19:11:07', 1),
(75, 9, 151500, '2026-04-10 19:11:07', 1),
(76, 7, 179291, '2026-04-24 14:55:13', 3),
(77, 7, 149125, '2026-04-29 14:37:36', 1),
(78, 7, 149125, '2026-04-29 14:37:36', 1);

-- --------------------------------------------------------

--
-- Table structure for table `session_scenarios`
--

CREATE TABLE `session_scenarios` (
  `session_id` varchar(255) NOT NULL,
  `events_data` longtext DEFAULT NULL,
  `stocks_data` longtext DEFAULT NULL,
  `currencies_data` longtext DEFAULT NULL,
  `index_data` longtext DEFAULT NULL,
  `gold_data` longtext DEFAULT NULL,
  `bonds_data` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tutorial_progress`
--

CREATE TABLE `tutorial_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `tutorial_level` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutorial_progress`
--

INSERT INTO `tutorial_progress` (`id`, `user_id`, `tutorial_level`) VALUES
(3, 2, 4),
(1, 2, 6),
(4, 3, 1),
(5, 7, 1),
(6, 7, 2),
(7, 7, 3),
(8, 7, 4),
(9, 7, 5),
(10, 7, 6),
(14, 9, 1),
(15, 9, 2),
(16, 9, 3);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`) VALUES
(2, 'test@test.com', '$2b$10$GwL2NRioRFFFUmvKjx.Q3uJyu/tuXxdW4xjzpx47N/8zYSR.4JkHW', '2025-10-10 14:32:50'),
(3, 'test1@test.com', '$2b$10$.qj0tTLoEJqE/X0FwqoVJuvYnYgpvX9FKmtB6j/aczeZ6IxzTGPQa', '2025-10-10 14:38:54'),
(4, 'password@test.com', '$2b$10$Q7JpDr7nA2qbim3lXhw.DuzD3o/gnOiauHZ2d9MnahNWTl7JM4yau', '2025-10-19 00:15:22'),
(5, 'thanet@gmail.com', '$2b$10$pgudJjyvV8KfEDscER4md.YG9AM812TGLUXNmSjHYwN1/BYqiPAZy', '2025-10-28 20:29:24'),
(6, 'mick@test.com', '$2b$10$ckjqFmEUcc5MakFnhJ1PguBpLS0JiJTCeb1VWw/2IEx9GAGHV2w1C', '2025-12-03 17:02:48'),
(7, 'test', '$2b$10$Rm7z5VQy5BKTlmquASRtWeui144pm2pQD/VxwtuMbXngfPJ04jZKO', '2026-04-01 16:20:43'),
(9, 'new', '$2b$10$0gWz9kzaciZ7u5ZTbazLl.fdmEU3Cj09GAGCPSbynUs.f1DXak3ZK', '2026-04-02 14:56:00');

-- --------------------------------------------------------

--
-- Table structure for table `user_achievements`
--

CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `score_id` int(11) DEFAULT NULL,
  `unlocked_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_achievements`
--

INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_id`, `score_id`, `unlocked_at`) VALUES
(1, 2, 12, 32, '2025-12-03 16:14:42'),
(2, 2, 5, 32, '2025-12-03 16:14:42'),
(3, 2, 12, 33, '2025-12-03 16:17:20'),
(4, 2, 5, 33, '2025-12-03 16:17:20'),
(5, 2, 3, 34, '2025-12-03 16:24:39'),
(6, 2, 8, 34, '2025-12-03 16:24:39'),
(7, 2, 4, 34, '2025-12-03 16:24:39'),
(8, 2, 2, 34, '2025-12-03 16:24:39'),
(9, 2, 1, 35, '2025-12-03 16:26:50'),
(10, 2, 12, 36, '2025-12-06 20:25:52'),
(11, 2, 11, 36, '2025-12-06 20:25:52'),
(12, 2, 3, 37, '2025-12-06 21:17:11'),
(13, 2, 4, 37, '2025-12-06 21:17:11'),
(14, 2, 2, 37, '2025-12-06 21:17:11'),
(15, 2, 6, 37, '2025-12-06 21:17:11'),
(16, 9, 5, 38, '2026-04-09 15:55:05'),
(17, 9, 12, 39, '2026-04-09 16:04:43'),
(18, 9, 11, 39, '2026-04-09 16:04:43'),
(19, 9, 12, 40, '2026-04-09 16:11:06'),
(20, 9, 11, 40, '2026-04-09 16:11:06'),
(21, 9, 5, 41, '2026-04-09 16:16:44'),
(22, 9, 1, 42, '2026-04-09 16:32:47'),
(23, 9, 3, 42, '2026-04-09 16:32:47'),
(24, 9, 8, 42, '2026-04-09 16:32:47'),
(25, 9, 5, 42, '2026-04-09 16:32:47'),
(26, 9, 12, 43, '2026-04-09 16:37:27'),
(27, 9, 11, 43, '2026-04-09 16:37:27'),
(28, 9, 12, 44, '2026-04-09 17:11:16'),
(29, 9, 5, 44, '2026-04-09 17:11:16'),
(30, 9, 12, 45, '2026-04-09 17:32:36'),
(31, 9, 1, 46, '2026-04-09 20:54:20'),
(32, 9, 3, 46, '2026-04-09 20:54:20'),
(33, 9, 8, 46, '2026-04-09 20:54:20'),
(34, 9, 5, 46, '2026-04-09 20:54:20'),
(35, 9, 12, 47, '2026-04-09 20:56:31'),
(36, 9, 11, 47, '2026-04-09 20:56:31'),
(37, 9, 12, 48, '2026-04-09 21:01:47'),
(38, 9, 11, 48, '2026-04-09 21:01:47'),
(39, 9, 5, 49, '2026-04-09 21:17:45'),
(40, 9, 12, 50, '2026-04-09 21:20:53'),
(41, 9, 11, 50, '2026-04-09 21:20:53'),
(42, 9, 5, 51, '2026-04-10 09:11:13'),
(43, 9, 12, 52, '2026-04-10 09:52:40'),
(44, 9, 5, 52, '2026-04-10 09:52:40'),
(45, 9, 12, 53, '2026-04-10 10:01:35'),
(46, 9, 11, 53, '2026-04-10 10:01:35'),
(47, 7, 12, 54, '2026-04-10 10:16:09'),
(48, 7, 11, 54, '2026-04-10 10:16:09'),
(49, 7, 5, 55, '2026-04-10 11:36:30'),
(50, 7, 12, 56, '2026-04-10 13:39:23'),
(51, 7, 11, 56, '2026-04-10 13:39:23'),
(52, 7, 1, 57, '2026-04-10 14:01:06'),
(53, 7, 3, 57, '2026-04-10 14:01:06'),
(54, 7, 8, 57, '2026-04-10 14:01:06'),
(55, 7, 4, 57, '2026-04-10 14:01:06'),
(56, 9, 1, 58, '2026-04-10 14:13:29'),
(57, 9, 3, 58, '2026-04-10 14:13:29'),
(58, 9, 8, 58, '2026-04-10 14:13:29'),
(59, 9, 4, 58, '2026-04-10 14:13:29'),
(60, 9, 5, 58, '2026-04-10 14:13:29'),
(61, 7, 3, 59, '2026-04-10 14:37:57'),
(62, 7, 8, 59, '2026-04-10 14:37:57'),
(63, 7, 5, 59, '2026-04-10 14:37:57'),
(64, 7, 1, 60, '2026-04-10 14:39:49'),
(65, 7, 3, 60, '2026-04-10 14:39:49'),
(66, 7, 8, 60, '2026-04-10 14:39:49'),
(67, 7, 4, 60, '2026-04-10 14:39:49'),
(68, 7, 5, 60, '2026-04-10 14:39:49'),
(69, 7, 3, 61, '2026-04-10 14:50:51'),
(70, 7, 8, 61, '2026-04-10 14:50:51'),
(71, 7, 4, 61, '2026-04-10 14:50:51'),
(72, 7, 5, 61, '2026-04-10 14:50:51'),
(73, 7, 12, 62, '2026-04-10 15:17:39'),
(74, 7, 5, 62, '2026-04-10 15:17:39'),
(75, 7, 3, 63, '2026-04-10 15:29:08'),
(76, 7, 11, 63, '2026-04-10 15:29:08'),
(77, 7, 12, 64, '2026-04-10 15:31:40'),
(78, 7, 11, 64, '2026-04-10 15:31:40'),
(79, 7, 12, 65, '2026-04-10 15:43:52'),
(80, 7, 11, 65, '2026-04-10 15:43:52'),
(81, 7, 12, 66, '2026-04-10 15:45:44'),
(82, 7, 5, 66, '2026-04-10 15:45:44'),
(83, 7, 12, 67, '2026-04-10 16:40:19'),
(84, 7, 12, 68, '2026-04-10 16:47:07'),
(85, 7, 12, 69, '2026-04-10 16:49:55'),
(86, 7, 1, 70, '2026-04-10 17:24:18'),
(87, 7, 8, 70, '2026-04-10 17:24:18'),
(88, 7, 4, 70, '2026-04-10 17:24:18'),
(89, 7, 12, 70, '2026-04-10 17:24:18'),
(90, 7, 12, 71, '2026-04-10 18:26:19'),
(91, 7, 5, 71, '2026-04-10 18:26:19'),
(92, 9, 12, 72, '2026-04-10 18:31:09'),
(93, 9, 11, 72, '2026-04-10 18:31:09'),
(94, 9, 12, 73, '2026-04-10 18:40:20'),
(95, 9, 12, 74, '2026-04-10 19:11:07'),
(96, 9, 11, 74, '2026-04-10 19:11:07'),
(97, 9, 12, 75, '2026-04-10 19:11:07'),
(98, 9, 11, 75, '2026-04-10 19:11:07'),
(99, 7, 12, 76, '2026-04-24 14:55:13'),
(100, 7, 12, 77, '2026-04-29 14:37:36'),
(101, 7, 12, 78, '2026-04-29 14:37:36');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `active_sessions`
--
ALTER TABLE `active_sessions`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `score_history`
--
ALTER TABLE `score_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `session_scenarios`
--
ALTER TABLE `session_scenarios`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `tutorial_progress`
--
ALTER TABLE `tutorial_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_level` (`user_id`,`tutorial_level`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `achievement_id` (`achievement_id`),
  ADD KEY `score_id` (`score_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `score_history`
--
ALTER TABLE `score_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `tutorial_progress`
--
ALTER TABLE `tutorial_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_achievements`
--
ALTER TABLE `user_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `active_sessions`
--
ALTER TABLE `active_sessions`
  ADD CONSTRAINT `active_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `score_history`
--
ALTER TABLE `score_history`
  ADD CONSTRAINT `score_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tutorial_progress`
--
ALTER TABLE `tutorial_progress`
  ADD CONSTRAINT `tutorial_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`),
  ADD CONSTRAINT `user_achievements_ibfk_3` FOREIGN KEY (`score_id`) REFERENCES `score_history` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
