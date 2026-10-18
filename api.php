<?php
declare(strict_types=1);
require __DIR__.'/includes/core.php';
try {
    boot();
    init_store();
    $action = (string)($_GET['action'] ?? 'bootstrap');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($action === 'login') {
        if ($method!=='POST') error_response('Method not allowed.',405);
        $body=input_json(); $email=strtolower(field($body,'email',200)); $password=(string)($body['password']??'');
        if (strlen($password)>1000) error_response('Invalid credentials.',401);
        $captcha=store(static fn(array &$db)=>hcaptcha_settings($db));
        if ($captcha['enabled']) {
            $token=field($body,'hcaptcha_token',4096);
            if ($token==='') error_response('Please complete the hCaptcha challenge.',422);
            if (!verify_hcaptcha($token,$captcha,(string)($_SERVER['REMOTE_ADDR']??''))) error_response('hCaptcha verification failed or expired. Please try again.',403);
        }
        $ip=(string)($_SERVER['REMOTE_ADDR']??'unknown');
        $key=hash('sha256',$email.'|'.$ip);
        $answer=store(static function(array &$db) use ($email,$password,$key) {
            $db['login_attempts']=array_filter($db['login_attempts'],static fn($x)=>($x['time']??0)>time()-900);
            $hits=0;
            foreach($db['login_attempts'] as $hit) if ($hit['key']===$key) $hits++;
            if ($hits>=8) return ['error'=>'Too many attempts. Try again in 15 minutes.','code'=>429];
            $user=null;
            foreach($db['users'] as $u) if (hash_equals(strtolower($u['email']),$email)) {$user=$u;break;}
            // Costly password verification even when email is not present.
            $hash=$user['password_hash']??'$2y$12$gVdXtTvIZN7jJUykNtM74OWFdktmtn.TzgKF9lTDHxHG6DcnCOx6q';
            if (!$user || !password_verify($password,$hash)) {
                $db['login_attempts'][]=['key'=>$key,'time'=>time()];
                return ['error'=>'Incorrect email or password.','code'=>401];
            }
            $db['login_attempts']=array_values(array_filter($db['login_attempts'],static fn($x)=>$x['key']!==$key));
            return ['user'=>$user];
        },true);
        if (isset($answer['error'])) error_response($answer['error'],$answer['code']);
        session_regenerate_id(true);
        $_SESSION['user_id']=$answer['user']['id'];
        $_SESSION['user_version']=$answer['user']['session_version']??1;
        $_SESSION['csrf']=bin2hex(random_bytes(24));
        json_response(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if ($action==='session') {
        $u=current_user();
        json_response(['ok'=>true,'authenticated'=>(bool)$u,'user'=>$u,'version'=>SOCIAL63_VERSION,
            'hcaptcha'=>store(static fn(array &$db)=>hcaptcha_public(hcaptcha_settings($db)))]);
    }
    $user=require_user();
    if ($action==='logout') {
        if ($method!=='POST') error_response('Method not allowed.',405);
        require_csrf();
        $_SESSION=[];
        if(ini_get('session.use_cookies')) { $p=session_get_cookie_params(); setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']); }
        session_destroy(); json_response(['ok'=>true]);
    }
    if ($action==='file') {
        if ($method!=='GET') error_response('Method not allowed.',405);
        $id=(string)($_GET['id']??'');
        $m=store(static function(array &$db) use($id) {foreach($db['media'] as $m) if($m['id']===$id) return $m; return null;});
        if (!$m) error_response('Media not found.',404);
        $path=SOCIAL63_UPLOADS.'/'.basename((string)$m['stored_name']);
        if (!is_file($path)) error_response('Media file missing.',404);
        $size=filesize($path); $start=0; $end=$size-1;
        $mime=$m['mime'];
        if (!in_array($mime,['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp','image/avif','image/gif'],true)) error_response('Invalid stored media.',500);
        $range=$_SERVER['HTTP_RANGE']??'';
        if ($range && preg_match('/^bytes=(\d*)-(\d*)$/',$range,$matches)) {
            if ($matches[1]==='' && $matches[2]!=='') { $suffix=min($size,(int)$matches[2]); $start=$size-$suffix; }
            else { $start=$matches[1]!==''?(int)$matches[1]:0; $end=$matches[2]!==''?(int)$matches[2]:$end; }
            if ($start>$end || $start >= $size) {header("Content-Range: bytes */$size"); http_response_code(416);exit;}
            $end=min($end,$size-1); http_response_code(206);
            header("Content-Range: bytes $start-$end/$size");
        }
        header('Content-Type: '.$mime); header('Content-Length: '.($end-$start+1));
        header('Accept-Ranges: bytes'); header('Content-Disposition: inline; filename="social63-media"');
        header('Cache-Control: private, max-age=600');
        $fp=fopen($path,'rb'); fseek($fp,$start); $remain=$end-$start+1;
        while($remain>0 && !feof($fp)) { $chunk=fread($fp,min(65536,$remain)); if($chunk==='') break; echo $chunk; $remain-=strlen($chunk); }
        fclose($fp); exit;
    }
    if ($action==='export') {
        if($method!=='GET') error_response('Method not allowed.',405);
        $kind=(string)($_GET['type']??'');
        if(!in_array($kind,['reviews','inbox','posts','videos','channels','campaigns','metrics'],true)) error_response('Invalid export.',400);
        $items=store(static fn(array &$db)=>$db[$kind]);
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="social63-'.$kind.'-'.gmdate('Ymd').'.csv"');
        echo "\xEF\xBB\xBF";
        $f=fopen('php://output','wb');
        $cols=$items?array_values(array_filter(array_keys($items[0]),static fn($x)=>!in_array($x,['stored_name'],true))):['id'];
        fputcsv($f,$cols);
        foreach($items as $r) fputcsv($f,array_map(static function($k)use($r){$v=isset($r[$k])?(string)$r[$k]:'';return preg_match('/^[\x00-\x20]*[=+\-@]/u',$v)?"'".$v:$v;},$cols));
        fclose($f);exit;
    }
    if ($action==='bootstrap') {
        if($method!=='GET') error_response('Method not allowed.',405);
        $result=store(static function(array &$db) {
            $copy=$db;
            $copy['users']=array_map(static function($u){unset($u['password_hash']);return $u;},$db['users']);
            unset($copy['login_attempts'], $copy['hcaptcha']);
            return $copy;
        });
        json_response(['ok'=>true,'data'=>$result,'user'=>$user,'csrf'=>$_SESSION['csrf'],'version'=>SOCIAL63_VERSION,'youtube_enabled'=>(bool)(config()['youtube_api_key']??''),'upload_limit_mb'=>(int)config()['max_upload_mb'],
            'hcaptcha'=>store(static fn(array &$db)=>hcaptcha_public(hcaptcha_settings($db),true))]);
    }
    if($method!=='POST') error_response('Method not allowed.',405);
    require_csrf();
    if ($action!=='change_password') writable_user($user);
    if ($action==='upload') {
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) error_response('Choose a file to upload.');
        $file=$_FILES['file'];
        if(($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK) error_response('Upload failed. Check the PHP upload_max_filesize and post_max_size settings.');
        $max=min(100,(int)(config()['max_upload_mb']??40))*1024*1024;
        if (($file['size']??0)<=0 || $file['size']>$max) error_response('File too large (maximum '.config()['max_upload_mb'].' MB).',413);
        if (!is_uploaded_file((string)$file['tmp_name'])) error_response('Invalid upload.',400);
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/avif'=>'avif','image/gif'=>'gif','video/mp4'=>'mp4','video/webm'=>'webm','video/quicktime'=>'mov'];
        if(!isset($types[$mime])) error_response('Unsupported file. Use JPG, PNG, WEBP, AVIF, GIF, MP4, WEBM or MOV.',415);
        if(str_starts_with($mime,'image/') && @getimagesize($file['tmp_name'])===false) error_response('Invalid image.',415);
        $stored=uid('media_').'.'.$types[$mime];
        $target=SOCIAL63_UPLOADS.'/'.$stored;
        if(!move_uploaded_file($file['tmp_name'],$target)) error_response('Unable to save upload.',500);
        @chmod($target,0600);
        $name=basename((string)$file['name']);
        $record=['id'=>uid('m_'),'name'=>substr($name,0,170),'stored_name'=>$stored,'mime'=>$mime,'size'=>(int)$file['size'],'created_at'=>now()];
        store(static function(array &$db) use($record){$db['media'][]=$record;activity($db,'Uploaded media: '.$record['name']);return null;},true);
        json_response(['ok'=>true,'item'=>$record]);
    }
    $body=input_json();
    if($action==='save_review') {
        $id=field($body,'id',80);
        $author=field($body,'author',110); $txt=field($body,'text',3000);
        $rating=num($body,'rating',5);
        if(!$author || !$txt || $rating<1) error_response('Reviewer, review and 1–5 stars are required.');
        $platform=selected($body,'platform',['Google','Facebook','Instagram','Yelp','Tripadvisor','Other'],'Google');
        $record=['author'=>$author,'text'=>$txt,'rating'=>$rating,'platform'=>$platform,'sentiment'=>$rating>=4?'positive':($rating===3?'neutral':'negative')];
        store(static function(array &$db) use($id,$record) {
            if($id){$i=find_index($db['reviews'],$id);$db['reviews'][$i]=array_replace($db['reviews'][$i],$record,['source'=>'manual']);}
            else{$db['reviews'][]=array_merge(['id'=>uid('r_'),'reply'=>'','status'=>'pending','created_at'=>now(),'source'=>'manual'],$record);}
            activity($db,'Saved review by '.$record['author']);
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='reply_review') {
        $id=field($body,'id',80); $reply=field($body,'reply',2500);
        store(static function(array &$db) use($id,$reply){$i=find_index($db['reviews'],$id);$db['reviews'][$i]['reply']=$reply;$db['reviews'][$i]['status']=$reply?'replied':'pending';activity($db,'Saved a local review reply draft');},true);
        json_response(['ok'=>true,'notice'=>'Saved locally. Not posted to the review platform.']);
    }
    if($action==='save_inbox') {
        $author=field($body,'author',110); $text=field($body,'text',3000);
        if(!$author||!$text) error_response('Author and message required.');
        $platform=selected($body,'platform',['Instagram','Facebook','X','Google','TikTok','LinkedIn','Other'],'Instagram');
        $kind=selected($body,'kind',['comment','message','mention','question'],'message');
        store(static function(array &$db) use($author,$text,$platform,$kind){$db['inbox'][]=['id'=>uid('i_'),'author'=>$author,'text'=>$text,'platform'=>$platform,'kind'=>$kind,'reply'=>'','status'=>'unread','created_at'=>now(),'source'=>'manual']; activity($db,'Saved a manual inbox message');},true);
        json_response(['ok'=>true]);
    }
    if($action==='reply_inbox') {
        $id=field($body,'id',80);$reply=field($body,'reply',2500);
        store(static function(array &$db) use($id,$reply){$i=find_index($db['inbox'],$id);$db['inbox'][$i]['reply']=$reply;$db['inbox'][$i]['status']=$reply?'replied':'read'; activity($db,'Saved a local inbox response');},true);
        json_response(['ok'=>true,'notice'=>'Saved locally. Not sent to a social network.']);
    }
    if($action==='mark_inbox') {
        $id=field($body,'id',80);$status=selected($body,'status',['read','unread'],'read');
        store(static function(array &$db) use($id,$status){$i=find_index($db['inbox'],$id);$db['inbox'][$i]['status']=$status;},true);
        json_response(['ok'=>true]);
    }
    if($action==='save_post') {
        $id=field($body,'id',80); $title=field($body,'title',160);$caption=field($body,'caption',5000);
        $platform=selected($body,'platform',['Instagram','Facebook','X','LinkedIn','TikTok','YouTube','Pinterest','Threads'],'Instagram');
        $status=selected($body,'status',['draft','scheduled','published'],'draft');
        $when=iso_datetime(field($body,'scheduled_at',60));
        $url=valid_url(field($body,'published_url',1000));
        $media=field($body,'media_id',80);
        if(!$title || !$caption) error_response('Title and caption are required.');
        if($status==='scheduled' && !$when) error_response('Select a schedule date and time.');
        $record=['title'=>$title,'caption'=>$caption,'platform'=>$platform,'status'=>$status,'scheduled_at'=>$when,'published_url'=>$url,'media_id'=>$media];
        store(static function(array &$db) use($id,$record){
            if($record['media_id'])find_index($db['media'],$record['media_id']);
            if($id){$i=find_index($db['posts'],$id);$db['posts'][$i]=array_replace($db['posts'][$i],$record,['source'=>'manual']);}
            else{$db['posts'][]=array_merge(['id'=>uid('p_'),'created_at'=>now(),'source'=>'manual'],$record);}
            activity($db,ucfirst($record['status']).' local post: '.$record['title']);
        },true);
        json_response(['ok'=>true,'notice'=>'Saved locally. No automatic social publishing is configured.']);
    }
    if($action==='save_channel') {
        $id=field($body,'id',80);$name=field($body,'name',160);
        $platform=selected($body,'platform',['Instagram','Facebook','TikTok','YouTube','LinkedIn','X','Google','Tripadvisor','Yelp','Pinterest','Threads'],'Instagram');
        $followers=num($body,'followers');
        $external=field($body,'external_id',140);
        if(!$name) error_response('Channel name or handle is required.');
        if($platform==='YouTube' && $external && !preg_match('/^UC[a-zA-Z0-9_-]{22}$/',$external)) error_response('YouTube channel ID must begin with UC and contain 24 characters.');
        $record=['name'=>$name,'platform'=>$platform,'followers'=>$followers,'external_id'=>$external,'status'=>'manual','updated_at'=>now()];
        store(static function(array &$db) use($id,$record) {
            if($id){$i=find_index($db['channels'],$id);$db['channels'][$i]=array_replace($db['channels'][$i],$record,['source'=>'manual']);}
            else{$db['channels'][]=array_merge(['id'=>uid('c_'),'source'=>'manual'],$record);}
            activity($db,'Saved channel '.$record['name']);
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='save_video') {
        $id=field($body,'id',80); $title=field($body,'title',180);$url=valid_url(field($body,'url',1000));
        $platform=selected($body,'platform',['YouTube','Instagram','TikTok','Facebook','X','Other'],'YouTube');
        if(!$title) error_response('Video title is required.');
        $record=['title'=>$title,'url'=>$url,'platform'=>$platform,'external_id'=>'','views'=>num($body,'views'),'likes'=>num($body,'likes'),'comments'=>num($body,'comments'),'shares'=>num($body,'shares'),'published_at'=>iso_datetime(field($body,'published_at',60))?:now(),'updated_at'=>now()];
        store(static function(array &$db) use($id,$record){
            if($id){$i=find_index($db['videos'],$id);$db['videos'][$i]=array_replace($db['videos'][$i],$record,['source'=>'manual']);}
            else{$db['videos'][]=array_merge(['id'=>uid('v_'),'source'=>'manual'],$record);}
            activity($db,'Saved video statistics: '.$record['title']);
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='save_campaign') {
        $id=field($body,'id',80);$name=field($body,'name',150);
        $status=selected($body,'status',['draft','active','completed','paused'],'draft');
        $platform=selected($body,'platform',['Instagram','Facebook','TikTok','YouTube','LinkedIn','X','Multi-platform'],'Multi-platform');
        $budget=num($body,'budget',100000000);$start=field($body,'start_date',10);$end=field($body,'end_date',10);$notes=field($body,'notes',2500);
        if(!$name) error_response('Campaign name required.');
        foreach([$start,$end] as $d) if($d && !preg_match('/^\d{4}-\d{2}-\d{2}$/',$d)) error_response('Invalid campaign date.');
        $record=compact('name','status','platform','budget','notes')+['start_date'=>$start,'end_date'=>$end];
        store(static function(array &$db) use($id,$record){
            if($id){$i=find_index($db['campaigns'],$id);$db['campaigns'][$i]=array_replace($db['campaigns'][$i],$record,['source'=>'manual']);}
            else $db['campaigns'][]=array_merge(['id'=>uid('k_'),'source'=>'manual'],$record);
            activity($db,'Saved campaign: '.$record['name']);
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='save_metrics') {
        $date=field($body,'date',10);
        if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || DateTimeImmutable::createFromFormat('!Y-m-d',$date)?->format('Y-m-d')!==$date) error_response('Invalid metric date.');
        $rec=['date'=>$date,'reach'=>num($body,'reach'),'engagement'=>num($body,'engagement'),'followers'=>signed_num($body,'followers'),'views'=>num($body,'views'),'source'=>'manual'];
        store(static function(array &$db) use($rec){
            foreach($db['metrics'] as $i=>$m) if($m['date']===$rec['date']) {$db['metrics'][$i]=$rec;activity($db,'Updated metrics for '.$rec['date']);return;}
            $db['metrics'][]=$rec; usort($db['metrics'],static fn($a,$b)=>strcmp($a['date'],$b['date']));activity($db,'Added metrics for '.$rec['date']);
        },true);
        json_response(['ok'=>true]);
    }
    if ($action==='save_hcaptcha') {
        require_owner($user);
        $enabled=($body['enabled']??'')==='1';
        $clear=($body['clear_keys']??'')==='1';
        $siteKey=field($body,'site_key',128);
        $secretKey=field($body,'secret_key',256);
        if ($siteKey!=='' && !preg_match('/^[a-zA-Z0-9_-]{16,128}$/D',$siteKey)) error_response('Enter a valid hCaptcha site key.');
        if ($secretKey!=='' && !preg_match('/^[a-zA-Z0-9_-]{16,256}$/D',$secretKey)) error_response('Enter a valid hCaptcha secret key.');
        store(static function(array &$db) use($enabled,$clear,$siteKey,$secretKey) {
            $old=hcaptcha_settings($db);
            $site=$clear?'':($siteKey!==''?$siteKey:$old['site_key']);
            $secret=$clear?'':($secretKey!==''?$secretKey:$old['secret_key']);
            if ($clear && $enabled) error_response('Disable hCaptcha before clearing its keys.');
            if ($enabled && ($site==='' || $secret==='')) error_response('Both hCaptcha keys are required before enabling login protection.');
            // hCaptcha's documented test keys accept synthetic tokens; never allow them on a public host.
            $testKeys=['10000000-ffff-ffff-ffff-000000000001','20000000-ffff-ffff-ffff-000000000002','30000000-ffff-ffff-ffff-000000000003'];
            $host=strtolower((string)parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST));
            if ($enabled && in_array($site,$testKeys,true) && !in_array($host,['127.0.0.1','localhost'],true)) error_response('hCaptcha test keys cannot be enabled on a public domain.');
            $db['hcaptcha']=['enabled'=>$enabled,'site_key'=>$site,'secret_key'=>$secret];
            activity($db,$clear?'Cleared hCaptcha keys':($enabled?'Enabled hCaptcha login protection':'Disabled hCaptcha login protection'));
        },true);
        json_response(['ok'=>true,'notice'=>$enabled?'hCaptcha is enabled for future sign-ins.':'hCaptcha is disabled for sign-in.']);
    }
    if($action==='save_workspace') {
        require_owner($user);
        $name=field($body,'name',100); $industry=field($body,'industry',100);$timezone=field($body,'timezone',70);
        if(!$name) error_response('Workspace name is required.');
        if(!in_array($timezone,DateTimeZone::listIdentifiers(),true)) error_response('Invalid timezone.');
        store(static function(array &$db) use($name,$industry,$timezone){$db['workspace']=compact('name','industry','timezone');activity($db,'Updated workspace settings');},true);
        json_response(['ok'=>true]);
    }
    if($action==='change_password') {
        $old=(string)($body['old_password']??''); $new=(string)($body['new_password']??'');
        if(strlen($new)<12 || strlen($new)>128) error_response('New password must be 12–128 characters.');
        store(static function(array &$db) use($user,$old,$new){
            $i=find_index($db['users'],$user['id']);
            if(!password_verify($old,$db['users'][$i]['password_hash'])) error_response('Current password incorrect.',403);
            $db['users'][$i]['password_hash']=password_hash($new,PASSWORD_DEFAULT);
            $db['users'][$i]['session_version']=($db['users'][$i]['session_version']??1)+1;
            $_SESSION['user_version']=$db['users'][$i]['session_version'];
            activity($db,'Password changed');
        },true);
        session_regenerate_id(true);json_response(['ok'=>true]);
    }
    if($action==='save_user') {
        require_owner($user);
        $name=field($body,'name',90);$email=strtolower(field($body,'email',200));$password=(string)($body['password']??'');
        $role=selected($body,'role',['owner','editor','viewer'],'editor');
        if(!$name || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($password)<12 || strlen($password)>128) error_response('Name, valid email and 12+ character password required.');
        store(static function(array &$db) use($name,$email,$password,$role){
            foreach($db['users'] as $u) if(strcasecmp($u['email'],$email)===0)error_response('Email already registered.',409);
            $db['users'][]=['id'=>uid('u_'),'name'=>$name,'email'=>$email,'password_hash'=>password_hash($password,PASSWORD_DEFAULT),'role'=>$role,'session_version'=>1,'created_at'=>now()];
            activity($db,'Added team member: '.$name);
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='delete_record') {
        $kind=selected($body,'type',['reviews','inbox','posts','videos','channels','campaigns','media','users'],'posts');
        $id=field($body,'id',80);if(!$id) error_response('Missing record ID.');
        if($kind==='users') require_owner($user);
        $fileToDelete=store(static function(array &$db) use($kind,$id,$user){
            $i=find_index($db[$kind],$id);$rec=$db[$kind][$i];
            if($kind==='users'){
                if($id===$user['id'])error_response('You cannot delete your own account.');
                $owners=array_filter($db['users'],static fn($x)=>$x['role']==='owner');
                if($rec['role']==='owner' && count($owners)<=1)error_response('At least one owner is required.');
            }
            array_splice($db[$kind],$i,1);activity($db,'Deleted '.$kind.' record');
            return $kind==='media' ? basename($rec['stored_name']) : null;
        },true);
        if($fileToDelete){$path=SOCIAL63_UPLOADS.'/'.$fileToDelete;if(is_file($path))@unlink($path);}
        json_response(['ok'=>true]);
    }
    if($action==='clear_demo') {
        require_owner($user);
        if(field($body,'confirmation',50)!=='CLEAR DEMO')error_response('Type CLEAR DEMO to confirm.');
        store(static function(array &$db){
            foreach(['channels','reviews','inbox','posts','videos','campaigns','metrics'] as $kind) {
                $db[$kind]=array_values(array_filter($db[$kind],static fn($v)=>($v['source']??'')!=='demo' && ($v['status']??'')!=='demo'));
            }
            $db['demo']=false;activity($db,'Removed demo content and sample statistics');
        },true);
        json_response(['ok'=>true]);
    }
    if($action==='sync_youtube') {
        $id=field($body,'id',80);
        $apiKey=(string)(config()['youtube_api_key']??'');
        if(!$apiKey) error_response('YouTube Data API key is not configured. Add it to config.local.php.',422);
        $ch=store(static function(array &$db) use($id){$i=find_index($db['channels'],$id);return $db['channels'][$i];});
        if($ch['platform']!=='YouTube'||!preg_match('/^UC[a-zA-Z0-9_-]{22}$/',$ch['external_id']))error_response('Add a valid YouTube channel ID starting with UC first.');
        if(!empty($ch['last_synced_at']) && time()-strtotime($ch['last_synced_at'])<120) error_response('Please wait two minutes between YouTube syncs to conserve API quota.',429);
        function yt_get(string $path, array $args, string $key): array {
            $url='https://www.googleapis.com/youtube/v3/'.$path.'?'.http_build_query($args+['key'=>$key]);
            $context=stream_context_create(['http'=>['timeout'=>12,'ignore_errors'=>true,'header'=>"Accept: application/json\r\nUser-Agent: Social63/1.0\r\n"]]);
            $raw=@file_get_contents($url,false,$context);
            if($raw===false) error_response('YouTube API could not be reached. Check server HTTPS access.',502);
            $json=json_decode($raw,true);
            if(!is_array($json)||isset($json['error']))error_response('YouTube API: '.substr((string)($json['error']['message']??'Unexpected response'),0,220),502);
            return $json;
        }
        $result=yt_get('channels',['part'=>'snippet,statistics,contentDetails','id'=>$ch['external_id']],$apiKey);
        $remote=$result['items'][0]??null;
        if(!$remote)error_response('YouTube channel not found.',404);
        $playlist=(string)($remote['contentDetails']['relatedPlaylists']['uploads']??'');
        $videos=[];
        if($playlist){
            $items=yt_get('playlistItems',['part'=>'contentDetails,snippet','playlistId'=>$playlist,'maxResults'=>12],$apiKey)['items']??[];
            $ids=array_values(array_filter(array_map(static fn($x)=>$x['contentDetails']['videoId']??null,$items)));
            if($ids){
                $stats=yt_get('videos',['part'=>'snippet,statistics','id'=>implode(',',$ids)],$apiKey)['items']??[];
                foreach($stats as $v) $videos[]=[
                    'id'=>uid('v_'),'title'=>substr((string)($v['snippet']['title']??'Video'),0,180),
                    'platform'=>'YouTube','url'=>'https://www.youtube.com/watch?v='.$v['id'],'external_id'=>(string)$v['id'],
                    'views'=>(int)($v['statistics']['viewCount']??0),'likes'=>(int)($v['statistics']['likeCount']??0),
                    'comments'=>(int)($v['statistics']['commentCount']??0),'shares'=>0,
                    'published_at'=>(string)($v['snippet']['publishedAt']??now()),'updated_at'=>now(),'source'=>'youtube_api',
                ];
            }
        }
        store(static function(array &$db) use($id,$remote,$videos) {
            $i=find_index($db['channels'],$id);
            $db['channels'][$i]['name']=substr((string)($remote['snippet']['title']??$db['channels'][$i]['name']),0,160);
            $db['channels'][$i]['followers']=(int)($remote['statistics']['subscriberCount']??0);
            $db['channels'][$i]['video_count']=(int)($remote['statistics']['videoCount']??0);
            $db['channels'][$i]['total_views']=(int)($remote['statistics']['viewCount']??0);
            $db['channels'][$i]['status']='youtube_api';$db['channels'][$i]['updated_at']=now();$db['channels'][$i]['last_synced_at']=now();
            $db['channels'][$i]['source']='manual';
            foreach($videos as $new){
                $found=false;
                foreach($db['videos'] as $j=>$old)if(($old['external_id']??'')===$new['external_id']){$db['videos'][$j]=array_replace($old,$new,['id'=>$old['id']]);$found=true;break;}
                if(!$found)$db['videos'][]=$new;
            }
            activity($db,'Synced official public YouTube statistics');
        },true);
        json_response(['ok'=>true,'synced'=>count($videos),'notice'=>'Synced official public YouTube channel and video statistics.']);
    }
    error_response('Unknown action.',404);
} catch (Throwable $e) {
    error_log('Social63 API: '.$e->getMessage());
    error_response('Server error. Check PHP error logs and private storage permissions.',500);
}
