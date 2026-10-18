<?php
declare(strict_types=1);

const SOCIAL63_VERSION = '1.1.0';
const SOCIAL63_DATA = __DIR__ . '/../storage/data.json';
const SOCIAL63_UPLOADS = __DIR__ . '/../storage/media';

function config(): array {
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/../config.example.php';
        $local = __DIR__ . '/../config.local.php';
        if (is_file($local)) $config = array_replace($config, require $local);
    }
    return $config;
}
function boot(): void {
    $cfg = config();
    date_default_timezone_set((string)($cfg['timezone'] ?? 'UTC'));
    if (!is_dir(dirname(SOCIAL63_DATA))) mkdir(dirname(SOCIAL63_DATA), 0750, true);
    if (!is_dir(SOCIAL63_UPLOADS)) mkdir(SOCIAL63_UPLOADS, 0750, true);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('social63sid');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com; frame-src https://hcaptcha.com https://*.hcaptcha.com; img-src 'self' data: https://i.ytimg.com https://hcaptcha.com https://*.hcaptcha.com; media-src 'self' blob:; connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com; font-src 'self' https://hcaptcha.com https://*.hcaptcha.com");
    header('Cache-Control: no-store, private');
}
/** hCaptcha credentials live exclusively in the protected JSON store. Existing v1.0 stores need no migration. */
function hcaptcha_settings(array $db): array {
    $raw = isset($db['hcaptcha']) && is_array($db['hcaptcha']) ? $db['hcaptcha'] : [];
    return [
        'enabled' => ($raw['enabled'] ?? false) === true,
        'site_key' => is_string($raw['site_key'] ?? null) ? $raw['site_key'] : '',
        'secret_key' => is_string($raw['secret_key'] ?? null) ? $raw['secret_key'] : '',
    ];
}
function hcaptcha_public(array $settings, bool $includeStatus = false): array {
    $result = ['enabled' => $settings['enabled'], 'site_key' => $settings['site_key']];
    if ($includeStatus) $result['secret_configured'] = $settings['secret_key'] !== '';
    return $result;
}
/** Validate each login token with the hCaptcha provider, never with browser-side checks alone. */
function verify_hcaptcha(string $token, array $settings, string $clientIp): bool {
    if (!$settings['enabled']) return true;
    if ($token === '' || strlen($token) > 4096 || $settings['site_key'] === '' || $settings['secret_key'] === '') return false;
    $fields = ['secret'=>$settings['secret_key'], 'response'=>$token, 'sitekey'=>$settings['site_key']];
    if (filter_var($clientIp, FILTER_VALIDATE_IP)) $fields['remoteip'] = $clientIp;
    $encoded = http_build_query($fields, '', '&', PHP_QUERY_RFC1738);
    $raw = false; $status = 0;
    try {
        if (function_exists('curl_init')) {
            $curl = curl_init('https://api.hcaptcha.com/siteverify');
            if ($curl === false) return false;
            curl_setopt_array($curl, [
                CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>$encoded,
                CURLOPT_HTTPHEADER=>['Content-Type: application/x-www-form-urlencoded','Accept: application/json'],
                CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>4, CURLOPT_TIMEOUT=>9,
                CURLOPT_FOLLOWLOCATION=>false, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
            ]);
            $raw = curl_exec($curl);
            $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
        } else {
            $ctx = stream_context_create(['http'=>[
                'method'=>'POST', 'header'=>"Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
                'content'=>$encoded, 'timeout'=>9, 'follow_location'=>0,
            ]]);
            $raw = @file_get_contents('https://api.hcaptcha.com/siteverify', false, $ctx);
            foreach ($http_response_header ?? [] as $line) {
                if (preg_match('~^HTTP/\d(?:\.\d)?\s+(\d{3})~', $line, $matches)) $status=(int)$matches[1];
            }
        }
    } catch (Throwable $e) {
        error_log('Social63 hCaptcha: Verification request failed.');
        return false;
    }
    if ($raw === false || $status !== 200 || strlen($raw) > 20000) return false;
    $response = json_decode($raw, true);
    return is_array($response) && ($response['success'] ?? false) === true;
}

function uid(string $prefix = ''): string { return $prefix . bin2hex(random_bytes(8)); }
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function ago(int $days, int $hours = 0): string { return gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400 - $hours * 3600); }
function future(int $days, int $hour = 9): string { return gmdate('Y-m-d\TH:i:s\Z', strtotime("+{$days} days") - (int)gmdate('G') * 3600 - (int)gmdate('i') * 60 + $hour * 3600); }

function demo_seed(): array {
    $c = config();
    $reviews = [
        ['name'=>'Sarah Mitchell','platform'=>'Google','rating'=>5,'text'=>'Amazing food and friendly staff! The atmosphere is perfect for catching up with friends.','sentiment'=>'positive','reply'=>'Thank you Sarah! We hope to see you soon.','days'=>0],
        ['name'=>'Marcus Lee','platform'=>'Facebook','rating'=>5,'text'=>'Great coffee and such a cozy place. Will definitely be back!','sentiment'=>'positive','reply'=>'We love hearing that, Marcus!','days'=>0],
        ['name'=>'Emma Carter','platform'=>'Yelp','rating'=>3,'text'=>'Good experience overall. The service was a bit slow but the coffee was delicious.','sentiment'=>'neutral','reply'=>'','days'=>1],
        ['name'=>'Daniel Kim','platform'=>'Tripadvisor','rating'=>5,'text'=>'One of the best coffee spots in town. Highly recommend!','sentiment'=>'positive','reply'=>'Thank you for the kind words!','days'=>2],
        ['name'=>'Olivia Brown','platform'=>'Google','rating'=>2,'text'=>'Food was good but our order was incorrect and took a long time.','sentiment'=>'negative','reply'=>'','days'=>2],
        ['name'=>'Aria Patel','platform'=>'Google','rating'=>5,'text'=>'Delicious flat white and excellent pastries.','sentiment'=>'positive','reply'=>'','days'=>3],
        ['name'=>'Leo Wilson','platform'=>'Facebook','rating'=>4,'text'=>'Lovely spot with relaxed music and great lunch options.','sentiment'=>'positive','reply'=>'','days'=>4],
    ];
    $inbox = [
        ['author'=>'Alex Johnson','text'=>'Do you have gluten-free options?','platform'=>'Facebook','kind'=>'message','minutes'=>10],
        ['author'=>'Sophie Martin','text'=>'This looks amazing! 😍','platform'=>'Instagram','kind'=>'comment','minutes'=>32],
        ['author'=>'Chris Taylor','text'=>'What are your opening hours on Sunday?','platform'=>'Facebook','kind'=>'message','minutes'=>60],
        ['author'=>'Priya Desai','text'=>'Loved our visit yesterday! Can’t wait to return.','platform'=>'X','kind'=>'mention','minutes'=>120],
        ['author'=>'Mark Wilson','text'=>'Do you offer loyalty cards?','platform'=>'Google','kind'=>'question','minutes'=>240],
    ];
    $p = [
        ['title'=>'Morning Coffee Vibes','platform'=>'Instagram','hour'=>9,'status'=>'scheduled','caption'=>'Start your day with a great cup of coffee ☕'],
        ['title'=>'New Seasonal Menu','platform'=>'LinkedIn','hour'=>12,'status'=>'scheduled','caption'=>'Fresh flavours, made with care. Explore our seasonal menu.'],
        ['title'=>'Behind the Scenes','platform'=>'TikTok','hour'=>15,'status'=>'scheduled','caption'=>'Meet the team making your favourite coffee.'],
        ['title'=>'Customer Stories','platform'=>'Facebook','hour'=>17,'status'=>'scheduled','caption'=>'Your stories make our day!'],
        ['title'=>'Weekend Special','platform'=>'X','hour'=>19,'status'=>'draft','caption'=>'We have a weekend surprise coming soon.'],
    ];
    $vs = [
        ['title'=>'The art of a perfect cappuccino','platform'=>'YouTube','views'=>14230,'likes'=>851,'comments'=>64,'days'=>2],
        ['title'=>'A day behind our coffee bar','platform'=>'Instagram','views'=>28640,'likes'=>1542,'comments'=>108,'days'=>5],
        ['title'=>'How we roast our coffee beans','platform'=>'TikTok','views'=>51400,'likes'=>3670,'comments'=>218,'days'=>9],
    ];
    $data = [
        'version'=>1, 'demo'=>true,
        'workspace'=>['name'=>'Bright Bean Café','industry'=>'Hospitality','timezone'=>'Europe/London'],
        'users'=>[['id'=>'u_owner','name'=>'Raivis','email'=>(string)$c['admin_email'],'password_hash'=>(string)$c['admin_password_hash'],'role'=>'owner','created_at'=>now()]],
        'channels'=>[], 'reviews'=>[], 'inbox'=>[], 'posts'=>[], 'media'=>[], 'videos'=>[], 'campaigns'=>[], 'metrics'=>[], 'activity'=>[], 'login_attempts'=>[],
        'hcaptcha'=>['enabled'=>false,'site_key'=>'','secret_key'=>''],
    ];
    foreach ([
        ['Instagram','@brightbeancafe',12400,''], ['Facebook','Bright Bean Café',8900,''], ['X','@brightbeancafe',4100,''], ['Google','Bright Bean Café',0,''], ['Tripadvisor','Bright Bean Café',0,''], ['YouTube','Bright Bean Café',2450,'']
    ] as $r) $data['channels'][] = ['id'=>uid('c_'),'platform'=>$r[0],'name'=>$r[1],'followers'=>$r[2],'external_id'=>$r[3],'status'=>'demo','updated_at'=>ago(0),'source'=>'demo'];
    foreach ($reviews as $r) $data['reviews'][] = ['id'=>uid('r_'),'author'=>$r['name'],'platform'=>$r['platform'],'rating'=>$r['rating'],'text'=>$r['text'],'sentiment'=>$r['sentiment'],'reply'=>$r['reply'],'status'=>$r['reply']?'replied':'pending','created_at'=>ago($r['days'],$r['days'] ? 3 : 1),'source'=>'demo'];
    foreach ($inbox as $r) $data['inbox'][] = ['id'=>uid('i_'),'author'=>$r['author'],'text'=>$r['text'],'platform'=>$r['platform'],'kind'=>$r['kind'],'reply'=>'','status'=>'unread','created_at'=>gmdate('Y-m-d\TH:i:s\Z', time() - $r['minutes'] * 60),'source'=>'demo'];
    foreach ($p as $r) $data['posts'][] = ['id'=>uid('p_'),'title'=>$r['title'],'caption'=>$r['caption'],'platform'=>$r['platform'],'scheduled_at'=>gmdate('Y-m-d\TH:i:s\Z', strtotime('today +'.(count($data['posts']) % 5).' day '.$r['hour'].':00 UTC')),'status'=>$r['status'],'media_id'=>'','published_url'=>'','created_at'=>now(),'source'=>'demo'];
    foreach ($vs as $r) $data['videos'][] = ['id'=>uid('v_'),'title'=>$r['title'],'platform'=>$r['platform'],'url'=>'','external_id'=>'','views'=>$r['views'],'likes'=>$r['likes'],'comments'=>$r['comments'],'shares'=>intdiv($r['likes'], 5),'published_at'=>ago($r['days']),'source'=>'demo','updated_at'=>now()];
    $data['campaigns'] = [
        ['id'=>uid('k_'),'name'=>'Autumn coffee launch','status'=>'active','platform'=>'Instagram','budget'=>250,'start_date'=>gmdate('Y-m-d',time()-86400*4),'end_date'=>gmdate('Y-m-d',time()+86400*10),'notes'=>'Promoting our new seasonal blends','source'=>'demo'],
        ['id'=>uid('k_'),'name'=>'Local community stories','status'=>'draft','platform'=>'Facebook','budget'=>100,'start_date'=>gmdate('Y-m-d'),'end_date'=>gmdate('Y-m-d',time()+86400*14),'notes'=>'Highlight customer experiences','source'=>'demo'],
    ];
    for ($d = 89; $d >= 0; $d--) {
        $i = 89 - $d;
        $data['metrics'][] = ['date'=>gmdate('Y-m-d',strtotime("-$d days")),'reach'=>max(0,3200 + $i * 130 + (int)(2100 * sin($i * .5))),'engagement'=>max(0,800 + $i * 46 + (int)(550 * cos($i * .4))),'followers'=>max(0,130 + $i * 13),'views'=>max(0,900 + $i * 98 + (int)(800 * sin($i * .25))),'source'=>'demo'];
    }
    $data['activity'][] = ['id'=>uid('a_'),'text'=>'Demo workspace created with example data','created_at'=>now()];
    return $data;
}

/** Atomic single-file store. Always lock before reading or writing to avoid lost updates. */
function store(callable $fn, bool $write = false): mixed {
    $path = SOCIAL63_DATA;
    $f = @fopen($path, 'c+');
    if ($f === false) throw new RuntimeException('Cannot open private storage. Check storage directory permissions.');
    @chmod($path, 0600);
    try {
        if (!flock($f, $write ? LOCK_EX : LOCK_SH)) throw new RuntimeException('Cannot lock private storage.');
        rewind($f);
        $raw = stream_get_contents($f);
        $first = !$raw;
        if ($first) {
            flock($f, LOCK_UN); fclose($f);
            return store($fn, true);
        }
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new RuntimeException('Invalid data file.');
        $result = $fn($data);
        if ($write) {
            $json = json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
            rewind($f); ftruncate($f, 0);
            if (fwrite($f, $json) !== strlen($json)) throw new RuntimeException('Could not save all data.');
            fflush($f);
        }
        flock($f, LOCK_UN);
        return $result;
    } finally { if (is_resource($f)) fclose($f); }
}
/** Initialize separately while holding an exclusive lock. */
function init_store(): void {
    $f = fopen(SOCIAL63_DATA, 'c+');
    if (!$f) throw new RuntimeException('Private storage is not writable.');
    try {
        if (!flock($f, LOCK_EX)) throw new RuntimeException('Unable to initialize private storage.');
        rewind($f);
        if (trim((string)stream_get_contents($f)) === '') {
            if (!config()['admin_password_hash']) throw new RuntimeException('Set admin_password_hash in config.local.php before using Social 63.');
            $seed = json_encode(demo_seed(), JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
            rewind($f); ftruncate($f, 0); fwrite($f, $seed); fflush($f);
        }
    } finally { flock($f, LOCK_UN); fclose($f); @chmod(SOCIAL63_DATA,0600); }
}
function json_response(array $data, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit;
}
function error_response(string $message, int $status = 400): never { json_response(['ok'=>false,'error'=>$message],$status); }
function input_json(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1048576) error_response('Request too large.',413);
    if (!str_contains(strtolower($_SERVER['CONTENT_TYPE'] ?? ''),'application/json')) error_response('Expected application/json.',415);
    $body = file_get_contents('php://input');
    $json = json_decode($body ?: '', true);
    if (!is_array($json)) error_response('Invalid JSON body.');
    return $json;
}
function field(array $a,string $key,int $max=255): string {
    $v=$a[$key]??'';
    if (!is_string($v) && !is_numeric($v)) error_response("Invalid {$key}.");
    $v=trim((string)$v);
    if (mb_length($v)>$max) error_response("{$key} is too long.");
    return $v;
}
function mb_length(string $v): int { return function_exists('mb_strlen') ? mb_strlen($v,'UTF-8') : strlen($v); }
function selected(array $a,string $key,array $choices, string $default=''): string {
    $v=field($a,$key,70) ?: $default;
    if (!in_array($v,$choices,true)) error_response('Invalid '.$key.'.');
    return $v;
}
function num(array $a, string $key, int $max = 1000000000): int {
    $v=$a[$key]??0;
    if (filter_var($v,FILTER_VALIDATE_INT)===false || (int)$v<0 || (int)$v>$max) error_response('Invalid '.$key.'.');
    return (int)$v;
}
function signed_num(array $a, string $key, int $max = 1000000000): int {
    $v=$a[$key]??0;
    if (filter_var($v,FILTER_VALIDATE_INT)===false || abs((int)$v)>$max) error_response('Invalid '.$key.'.');
    return (int)$v;
}
function iso_datetime(string $s): string {
    if (!$s) return '';
    try { $dt=new DateTimeImmutable($s); return $dt->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z'); }
    catch (Throwable) { error_response('Invalid date/time.'); }
}
function valid_url(string $url): string {
    if (!$url) return '';
    if (strlen($url)>1000 || !filter_var($url,FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($url,PHP_URL_SCHEME) ?: ''),['https','http'],true)) error_response('Use a valid HTTPS/HTTP URL.');
    return $url;
}
function current_user(): ?array {
    $id=$_SESSION['user_id']??null;
    if (!$id || !is_string($id)) return null;
    return store(static function(array &$db) use ($id) {
        foreach($db['users'] as $u) if ($u['id']===$id) {
            if ((int)($_SESSION['user_version'] ?? 1) !== (int)($u['session_version'] ?? 1)) return null;
            unset($u['password_hash']); return $u;
        }
        return null;
    });
}
function require_user(): array {
    $u=current_user(); if (!$u) error_response('Please sign in again.',401); return $u;
}
function writable_user(array $u): void { if (($u['role']??'')==='viewer') error_response('Your account has read-only access.',403); }
function require_owner(array $u): void { if (($u['role']??'')!=='owner') error_response('Owner permissions required.',403); }
function require_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals((string)($_SESSION['csrf']??''),$token)) error_response('Security token expired. Refresh and try again.',419);
    $origin=$_SERVER['HTTP_ORIGIN']??'';
    if ($origin) {
        $originHost=parse_url($origin,PHP_URL_HOST);
        $host=explode(':',$_SERVER['HTTP_HOST']??'')[0];
        if (!$originHost || strcasecmp((string)$originHost,$host)!==0) error_response('Request origin not permitted.',403);
    }
}
function activity(array &$db,string $label): void {
    array_unshift($db['activity'],['id'=>uid('a_'),'text'=>$label,'created_at'=>now()]);
    $db['activity']=array_slice($db['activity'],0,60);
}
function find_index(array $rows,string $id): int {
    foreach ($rows as $i=>$r) if ($r['id']===$id) return $i;
    error_response('Item not found.',404);
}
